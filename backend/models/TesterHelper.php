<?php

require_once __DIR__ . '/Database.php';

class TesterHelper
{
    /**
     * Checks if the given user payload corresponds to a tester account
     */
    public static function isTester($user): bool
    {
        if (empty($user)) {
            return false;
        }
        if (!empty($user['is_tester'])) {
            return true;
        }
        $username = strtolower(trim($user['username'] ?? ''));
        return in_array($username, ['admin_tester', 'directeur_demo', 'user_tester', 'user']);
    }

    /**
     * Retrieves the primary test client ID.
     * Auto-creates the user_tester account if it doesn't already exist.
     */
    public static function getTesterClientId($sqlOrPdo = null): int
    {
        $pdo = ($sqlOrPdo instanceof PDO) ? $sqlOrPdo : Database::getInstance();

        // 1. Check for user_tester
        $stmt = $pdo->prepare("SELECT id FROM clients WHERE username = 'user_tester' LIMIT 1");
        $stmt->execute();
        $id = $stmt->fetchColumn();
        if ($id) {
            return (int)$id;
        }

        // 2. Fallback to 'user' if present
        $stmt = $pdo->prepare("SELECT id FROM clients WHERE username = 'user' LIMIT 1");
        $stmt->execute();
        $id = $stmt->fetchColumn();
        if ($id) {
            return (int)$id;
        }

        // 3. Otherwise create user_tester
        $password = password_hash('tester123', PASSWORD_BCRYPT);
        $insert = $pdo->prepare("
            INSERT INTO clients (name, username, password, email, phone, address) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $insert->execute([
            'Client Testeur Démo',
            'user_tester',
            $password,
            'user_tester@kalyo.ma',
            '+212 6 00 11 22 33',
            'Angle Boulevard d\'Anfa et Zerktouni, Casablanca, Maroc'
        ]);

        return (int)$pdo->lastInsertId();
    }

    /**
     * Retrieves the primary tester admin ID (admin_tester or fallback to directeur_demo)
     */
    public static function getTesterAdminId($sqlOrPdo = null): int
    {
        $pdo = ($sqlOrPdo instanceof PDO) ? $sqlOrPdo : Database::getInstance();
        $stmt = $pdo->prepare("SELECT id FROM admin WHERE username = 'admin_tester' LIMIT 1");
        $stmt->execute();
        $id = $stmt->fetchColumn();
        if ($id) {
            return (int)$id;
        }
        $stmt2 = $pdo->prepare("SELECT id FROM admin WHERE username = 'directeur_demo' LIMIT 1");
        $stmt2->execute();
        $id2 = $stmt2->fetchColumn();
        return $id2 ? (int)$id2 : 3;
    }


    /**
     * Resets the tester sandbox to a pristine state:
     * - Deletes all payments, invoices, subtasks, tasks, services and projects belonging to the tester client.
     * - Preserves the client and admin accounts themselves.
     */
    public static function resetTesterSandbox(): array
    {
        $pdo = Database::getInstance();
        $testerClientId = self::getTesterClientId($pdo);

        try {
            $pdo->beginTransaction();

            // 1. Delete Payments for tester client
            $pdo->prepare("DELETE FROM payments WHERE client_id = ?")->execute([$testerClientId]);

            // 2. Delete Invoices for tester client
            $pdo->prepare("DELETE FROM invoices WHERE client_id = ?")->execute([$testerClientId]);

            // 3. Find all projects for tester client
            $stmtProj = $pdo->prepare("SELECT id FROM projects WHERE client_id = ?");
            $stmtProj->execute([$testerClientId]);
            $projIds = $stmtProj->fetchAll(PDO::FETCH_COLUMN);

            if (!empty($projIds)) {
                $inProjects = implode(',', array_map('intval', $projIds));

                // Find services
                $stmtServ = $pdo->query("SELECT id FROM services WHERE project_id IN ($inProjects)");
                $servIds = $stmtServ->fetchAll(PDO::FETCH_COLUMN);

                if (!empty($servIds)) {
                    $inServices = implode(',', array_map('intval', $servIds));

                    // Find tasks
                    $stmtTasks = $pdo->query("SELECT id FROM tasks WHERE service_id IN ($inServices)");
                    $taskIds = $stmtTasks->fetchAll(PDO::FETCH_COLUMN);

                    if (!empty($taskIds)) {
                        $inTasks = implode(',', array_map('intval', $taskIds));
                        $pdo->exec("DELETE FROM subtasks WHERE task_id IN ($inTasks)");
                    }

                    $pdo->exec("DELETE FROM tasks WHERE service_id IN ($inServices)");
                }

                $pdo->exec("DELETE FROM services WHERE project_id IN ($inProjects)");
                $pdo->exec("DELETE FROM projects WHERE id IN ($inProjects)");
            }

            // 4. Delete notifications and activity logs for tester accounts
            $stmtAdmin = $pdo->query("SELECT id FROM admin WHERE username IN ('admin_tester', 'directeur_demo')");
            $adminIds = $stmtAdmin->fetchAll(PDO::FETCH_COLUMN);
            $inAdmins = !empty($adminIds) ? implode(',', array_map('intval', $adminIds)) : '0';

            // Delete tester notifications (both client and tester admin notifications)
            $pdo->exec("DELETE FROM notifications WHERE (user_role = 'client' AND user_id = {$testerClientId}) OR (user_role = 'admin' AND user_id IN ({$inAdmins}))");

            if (!empty($adminIds)) {
                $pdo->exec("DELETE FROM activity_logs WHERE user_id IN ({$inAdmins})");
            }

            $pdo->commit();

            return [
                'success' => true,
                'message' => 'Espace testeur réinitialisé à zéro avec succès (0 projet, 0 facture).'
            ];
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            return [
                'success' => false,
                'error' => 'Erreur lors de la réinitialisation : ' . $e->getMessage()
            ];
        }
    }
}
