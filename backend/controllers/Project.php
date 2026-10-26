<?php

require_once __DIR__ . '/../models/Sql.php';
require_once __DIR__ . '/../models/TesterHelper.php';
require_once __DIR__ . '/ActivityLog.php';
require_once __DIR__ . '/Notifications.php';

class Project
{
    private $sql;
    private $logger;

    public function __construct()
    {
        $this->sql = new Sql();
        $this->logger = new ActivityLog();
    }

    public function autoUpdateStatuses()
    {
        // Prevent 'pending' projects from automatically becoming 'in_progress' 
        // just because start_date arrived. The client MUST confirm them first.
        
        // Only update 'in_progress' projects to 'overdue' if end_date has passed
        $this->sql->update("
            UPDATE projects 
            SET status = 'overdue' 
            WHERE status = 'in_progress' 
            AND end_date IS NOT NULL 
            AND end_date < CURRENT_DATE()
        ");
    }

    public function getAll($clientId = null, $user = null)
    {
        $this->autoUpdateStatuses();

        global $userData;
        $currentUser = $user ?? $userData ?? null;
        $isTester = TesterHelper::isTester($currentUser);
        $testerClientId = TesterHelper::getTesterClientId($this->sql->getPdo());

        $sql = "SELECT p.*, c.name as client_name
                FROM projects p 
                JOIN clients c ON p.client_id = c.id";
        $params = [];
        $where = [];

        if ($currentUser && isset($currentUser['role']) && $currentUser['role'] === 'client') {
            $where[] = "p.client_id = :user_cid";
            $params['user_cid'] = (int)$currentUser['id'];
        } elseif ($isTester) {
            // Admin Tester ONLY sees projects created for their test client!
            // Initially 0 projects -> cleanly empty!
            $where[] = "p.client_id = :tester_cid";
            $params['tester_cid'] = $testerClientId;
        } else {
            // Super Admin
            if ($clientId) {
                $where[] = "p.client_id = :client_id";
                $params['client_id'] = (int)$clientId;
            } else {
                // Exclude sandbox test client from main admin view
                $where[] = "p.client_id != :tester_cid";
                $params['tester_cid'] = $testerClientId;
            }
        }

        if (!empty($where)) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }

        $sql .= " ORDER BY p.created_at DESC";

        return $this->sql->getAll($sql, $params);
    }

    public function show($id, $user = null)
    {
        $this->autoUpdateStatuses();

        global $userData;
        $currentUser = $user ?? $userData ?? null;
        $isTester = TesterHelper::isTester($currentUser);
        $testerClientId = TesterHelper::getTesterClientId($this->sql->getPdo());

        require_once __DIR__ . '/Tasks.php';
        $tasksController = new Tasks();
        $tasksController->autoUpdateStatuses();

        $project = $this->sql->getId("
            SELECT p.*, c.name as client_name, c.email as client_email, c.phone as client_phone
            FROM projects p 
            JOIN clients c ON p.client_id = c.id 
            WHERE p.id = :id", 
            ['id' => $id]
        );

        if (!$project) {
            return null;
        }

        // Security / Isolation check
        if ($currentUser && isset($currentUser['role']) && $currentUser['role'] === 'client') {
            if ((int)$project['client_id'] !== (int)$currentUser['id']) {
                return null;
            }
        } elseif ($isTester) {
            if ((int)$project['client_id'] !== $testerClientId) {
                return null;
            }
        }

        // Get Services for this project
        $services = $this->sql->getAll("
            SELECT * FROM services WHERE project_id = :project_id
        ", ['project_id' => $id]);

        // For each service, get its tasks
        foreach ($services as &$service) {
            $service['tasks'] = $this->sql->getAll("
                SELECT * FROM tasks WHERE service_id = :service_id
            ", ['service_id' => $service['id']]);
        }

        $project['services'] = $services;

        return $project;
    }

    public function store($data, $user = null)
    {
        global $userData;
        $currentUser = $user ?? $userData ?? null;
        $isTester = TesterHelper::isTester($currentUser);
        $testerClientId = TesterHelper::getTesterClientId($this->sql->getPdo());

        $pdo = $this->sql->getPdo();
        
        try {
            $pdo->beginTransaction();

            if ($isTester) {
                // Tester is locked to their single designated test client
                $data['client_id'] = $testerClientId;

                // STRICT RULE: Max 3 projects for tester!
                $countStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM projects WHERE client_id = :cid");
                $countStmt->execute([':cid' => $testerClientId]);
                $clientProjCount = (int)$countStmt->fetchColumn();
                if ($clientProjCount >= 3) {
                    throw new Exception("Limite de test atteinte : Le compte testeur est strictement limité à 3 projets maximum (Quota actuel : {$clientProjCount}/3). Vous pouvez réinitialiser l'espace pour recommencer.");
                }
            } elseif ($currentUser && isset($currentUser['role']) && $currentUser['role'] === 'client') {
                $data['client_id'] = (int)$currentUser['id'];
                $countStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM projects WHERE client_id = :cid");
                $countStmt->execute([':cid' => (int)$currentUser['id']]);
                $clientProjCount = (int)$countStmt->fetchColumn();
                if ($clientProjCount >= 3) {
                    throw new Exception("Limite de test atteinte : Votre espace client est limité à 3 projets maximum pour la démonstration (Quota actuel : {$clientProjCount}/3).");
                }
            }

            // 1. Validate mandatory fields
            if (empty($data['client_id']) || empty($data['name'])) {
                throw new Exception("Le nom du projet et le client sont obligatoires.");
            }

            // 2. Create the project
            $stmt = $pdo->prepare("
                INSERT INTO projects (name, description, start_date, end_date, client_id, status) 
                VALUES (:name, :description, :start_date, :end_date, :client_id, :status)
            ");

            $stmt->execute([
                ':name' => htmlspecialchars($data['name']),
                ':description' => htmlspecialchars($data['description'] ?? ''),
                ':start_date' => !empty($data['start_date']) ? $data['start_date'] : null,
                ':end_date' => !empty($data['end_date']) ? $data['end_date'] : null,
                ':client_id' => (int)$data['client_id'],
                ':status' => $data['status'] ?? 'pending'
            ]);

            $projectId = $pdo->lastInsertId();

            // 3. Handle individual ad-hoc services provided from wizard
            if (!empty($data['services']) && is_array($data['services'])) {
                $stmtInsertService = $pdo->prepare("
                    INSERT INTO services (project_id, name, price, duration_days, description, status) 
                    VALUES (:project_id, :name, :price, :duration_days, :description, 'pending')
                ");

                foreach ($data['services'] as $sv) {
                    if (is_array($sv)) {
                        $stmtInsertService->execute([
                            ':project_id' => $projectId,
                            ':name' => htmlspecialchars($sv['name']),
                            ':price' => (float)($sv['price'] ?? 0),
                            ':duration_days' => (int)($sv['duration_days'] ?? 0),
                            ':description' => htmlspecialchars($sv['description'] ?? '')
                        ]);
                    }
                }
            }

            $pdo->commit();
            
            // Send notification to the client
            $clientInfo = $this->sql->getId("SELECT name FROM clients WHERE id = :id", [':id' => (int)$data['client_id']]);
            $notifController = new NotificationsController();
            $notifController->create([
                'user_id'   => (int)$data['client_id'],
                'user_role' => 'client',
                'type'      => 'info',
                'message' => "🚀 Un nouveau projet \"{$data['name']}\" vous a été affecté. Veuillez valider la proposition dans votre Espace Client."
            ]);

            return ['success' => true, 'id' => $projectId];

        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function confirmProject($id, $clientId)
    {
        // Verify the project belongs to this client
        $project = $this->sql->getId(
            "SELECT id, client_id, name, status FROM projects WHERE id = :id",
            [':id' => $id]
        );

        if (!$project) {
            return ['success' => false, 'error' => 'Projet introuvable.'];
        }

        if ((int)$project['client_id'] !== (int)$clientId) {
            return ['success' => false, 'error' => 'Accès refusé.'];
        }

        if ($project['status'] !== 'pending') {
            return ['success' => false, 'error' => 'Ce projet ne peut pas être confirmé (statut actuel: ' . $project['status'] . ').'];
        }

        $result = $this->sql->update(
            "UPDATE projects SET status = 'in_progress' WHERE id = :id",
            [':id' => $id]
        );

        if ($result) {
            $notifController = new NotificationsController();
            // Notify the client (confirmation receipt)
            $notifController->create([
                'user_id'   => (int)$clientId,
                'user_role' => 'client',
                'type'      => 'success',
                'message'   => "✅ Vous avez confirmé votre projet. Il est maintenant en cours."
            ]);

            // Target ONLY the corresponding Admin:
            $testerClientId = TesterHelper::getTesterClientId($this->sql->getPdo());
            if ((int)$clientId === (int)$testerClientId) {
                // Target ONLY admin_tester
                $testerAdminId = TesterHelper::getTesterAdminId($this->sql->getPdo());
                $notifController->create([
                    'user_id'   => $testerAdminId,
                    'user_role' => 'admin',
                    'type'      => 'success',
                    'message'   => "✅ Le client testeur @user_tester a validé l'offre pour \"{$project['name']}\"."
                ]);
            } else {
                // Target agency admins (excluding test admins)
                $admins = $this->sql->getAll("SELECT id FROM admin WHERE username NOT IN ('admin_tester', 'directeur_demo')");
                foreach ($admins as $admin) {
                    $notifController->create([
                        'user_id'   => (int)$admin['id'],
                        'user_role' => 'admin',
                        'type'      => 'success',
                        'message'   => "✅ Le client a validé l'offre pour \"{$project['name']}\"."
                    ]);
                }
            }
        }

        return ['success' => $result];
    }

    public function rejectProject($id, $clientId, $data = [])
    {
        // Verify the project belongs to this client
        $project = $this->sql->getId(
            "SELECT id, client_id, name, status FROM projects WHERE id = :id",
            [':id' => $id]
        );

        if (!$project) {
            return ['success' => false, 'error' => 'Projet introuvable.'];
        }

        if ((int)$project['client_id'] !== (int)$clientId) {
            return ['success' => false, 'error' => 'Accès refusé.'];
        }

        if ($project['status'] !== 'pending') {
            return ['success' => false, 'error' => 'Ce projet ne peut pas être refusé (statut actuel: ' . $project['status'] . ').'];
        }

        $note = isset($data['note']) ? htmlspecialchars($data['note']) : 'Aucune note fournie.';

        $result = $this->sql->update(
            "UPDATE projects SET status = 'cancelled', rejection_note = :note WHERE id = :id",
            [':id' => $id, ':note' => $note]
        );

        if ($result) {
            $notifController = new NotificationsController();
            
            // Client notification
            $notifController->create([
                'user_id'   => (int)$clientId,
                'user_role' => 'client',
                'type'      => 'warning',
                'message'   => "❌ Vous avez refusé le projet."
            ]);

            // Target ONLY the corresponding Admin:
            $testerClientId = TesterHelper::getTesterClientId($this->sql->getPdo());
            if ((int)$clientId === (int)$testerClientId) {
                // Target ONLY admin_tester
                $testerAdminId = TesterHelper::getTesterAdminId($this->sql->getPdo());
                $notifController->create([
                    'user_id'   => $testerAdminId,
                    'user_role' => 'admin',
                    'type'      => 'error',
                    'message'   => "⚠️ Le projet \"{$project['name']}\" a été refusé par le client testeur. Note: {$note}"
                ]);
            } else {
                // Target agency admins (excluding test admins)
                $admins = $this->sql->getAll("SELECT id FROM admin WHERE username NOT IN ('admin_tester', 'directeur_demo')");
                foreach ($admins as $admin) {
                    $notifController->create([
                        'user_id'   => (int)$admin['id'],
                        'user_role' => 'admin',
                        'type'      => 'error',
                        'message'   => "⚠️ Le projet \"{$project['name']}\" a été refusé par le client. Note: {$note}"
                    ]);
                }
            }
        } else {
            return ['success' => false, 'error' => 'Mise à jour a échoué. SQL Error possible.', 'sql_error' => $this->sql->getPdo()->errorInfo()];
        }

        return ['success' => true];
    }

    public function resendOffer($id)
    {
        $project = $this->sql->getId("SELECT id, client_id, name FROM projects WHERE id = :id", [':id' => $id]);
        if (!$project) {
            return ['success' => false, 'error' => 'Projet introuvable.'];
        }

        $result = $this->sql->update(
            "UPDATE projects SET status = 'pending', rejection_note = NULL WHERE id = :id",
            [':id' => $id]
        );

        if ($result) {
            $notifController = new NotificationsController();
            $notifController->create([
                'user_id'   => (int)$project['client_id'],
                'user_role' => 'client',
                'type'      => 'info',
                'message' => "🎉 Une offre de projet a été mise à jour et renvoyée : \"{$project['name']}\". Veuillez la confirmer. [project_id:{$project['id']}]"
            ]);
            return ['success' => true];
        }

        return ['success' => false, 'error' => 'Mise à jour a échoué. SQL Error possible.', 'sql_error' => $this->sql->getPdo()->errorInfo()];
    }

    public function update($id, $data)
    {
        $pdo = $this->sql->getPdo();

        try {
            $pdo->beginTransaction();

            // 1. Validate mandatory fields
            if (empty($data['client_id']) || empty($data['name'])) {
                throw new Exception("Le nom du projet et le client sont obligatoires pour continuer.");
            }

            // 2. Update core project fields
            $stmt = $pdo->prepare("
                UPDATE projects SET 
                    name        = :name, 
                    description = :description, 
                    start_date  = :start_date, 
                    end_date    = :end_date, 
                    status      = :status,
                    client_id   = :client_id
                WHERE id = :id
            ");

            $stmt->execute([
                ':id'          => $id,
                ':name'        => htmlspecialchars($data['name']),
                ':description' => htmlspecialchars($data['description'] ?? ''),
                ':start_date'  => !empty($data['start_date']) ? $data['start_date'] : null,
                ':end_date'    => !empty($data['end_date']) ? $data['end_date'] : null,
                ':status'      => $data['status'] ?? 'pending',
                ':client_id'   => (int)$data['client_id']
            ]);

            $pdo->commit();
            return ['success' => true];

        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function delete($id)
    {
        try {
            $result = $this->sql->delete("DELETE FROM projects WHERE id = :id", ['id' => $id]);
            if (!$result) {
                http_response_code(404);
                return ['success' => false, 'error' => 'Projet non trouvé.'];
            }
            return ['success' => true];
        } catch (PDOException $e) {
            // Check if error is related to foreign key constraint
            if ($e->getCode() == '23000') {
                http_response_code(400);
                return [
                    'success' => false, 
                    'error' => "Impossible de supprimer ce projet car il possède des services, factures ou paiements associés. Supprimez-les d'abord."
                ];
            }
            http_response_code(500);
            return ['success' => false, 'error' => 'Erreur serveur lors de la suppression.'];
        }
    }
}
