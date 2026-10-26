<?php

require_once __DIR__ . '/../models/Sql.php';
require_once __DIR__ . '/../models/TesterHelper.php';
require_once __DIR__ . '/ActivityLog.php';
require_once __DIR__ . '/Notifications.php';

class Finance
{
    private $sql;
    private $logger;

    public function __construct()
    {
        $this->sql = new Sql();
        $this->logger = new ActivityLog();
    }

    // --- Invoices Methods ---

    public function getAllInvoices($clientId = null, $user = null)
    {
        global $userData;
        $currentUser = $user ?? $userData ?? null;
        $isTester = TesterHelper::isTester($currentUser);
        $testerClientId = TesterHelper::getTesterClientId($this->sql->getPdo());

        $sql = "SELECT i.*, c.name as client_name, p.name as project_name 
                FROM invoices i 
                JOIN clients c ON i.client_id = c.id 
                JOIN projects p ON i.project_id = p.id";
        $params = [];
        $where = [];

        if ($currentUser && isset($currentUser['role']) && $currentUser['role'] === 'client') {
            $where[] = "i.client_id = :user_cid";
            $params['user_cid'] = (int)$currentUser['id'];
        } elseif ($isTester) {
            // Tester only sees invoices for test client
            $where[] = "i.client_id = :tester_cid";
            $params['tester_cid'] = $testerClientId;
        } else {
            // Super Admin
            if ($clientId) {
                $where[] = "i.client_id = :client_id";
                $params['client_id'] = (int)$clientId;
            } else {
                $where[] = "i.client_id != :tester_cid";
                $params['tester_cid'] = $testerClientId;
            }
        }

        if (!empty($where)) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }

        $sql .= " ORDER BY i.created_at DESC";

        return [
            'success' => true,
            'data'    => $this->sql->getAll($sql, $params)
        ];
    }

    public function getInvoice($id, $user = null)
    {
        global $userData;
        $currentUser = $user ?? $userData ?? null;
        $isTester = TesterHelper::isTester($currentUser);
        $testerClientId = TesterHelper::getTesterClientId($this->sql->getPdo());

        $invoice = $this->sql->getId("
            SELECT i.*, 
                   c.name as client_name, c.email as client_email, c.phone as client_phone, c.address as client_address, 
                   p.name as project_name 
            FROM invoices i 
            JOIN clients c ON i.client_id = c.id 
            JOIN projects p ON i.project_id = p.id
            WHERE i.id = :id
        ", ['id' => $id]);

        if (!$invoice) {
            return null;
        }

        if ($currentUser && isset($currentUser['role']) && $currentUser['role'] === 'client') {
            if ((int)$invoice['client_id'] !== (int)$currentUser['id']) {
                return null;
            }
        } elseif ($isTester) {
            if ((int)$invoice['client_id'] !== $testerClientId) {
                return null;
            }
        }

        $invoice['services'] = $this->sql->getAll(
            "SELECT * FROM services WHERE project_id = :project_id", 
            ['project_id' => $invoice['project_id']]
        );

        return $invoice;
    }

    public function createInvoice($data, $user = null)
    {
        global $userData;
        $currentUser = $user ?? $userData ?? null;
        $isTester = TesterHelper::isTester($currentUser);
        $testerClientId = TesterHelper::getTesterClientId($this->sql->getPdo());

        if ($isTester) {
            $data['client_id'] = $testerClientId;
        }

        $id = $this->sql->create(
            "INSERT INTO invoices (project_id, client_id, amount, due_date, status, notes) 
             VALUES (:project_id, :client_id, :amount, :due_date, :status, :notes)",
            [
                ':project_id' => (int)$data['project_id'],
                ':client_id' => (int)$data['client_id'],
                ':amount' => (float)$data['amount'],
                ':due_date' => $data['due_date'] ?? null,
                ':status' => $data['status'] ?? 'draft',
                ':notes' => htmlspecialchars($data['notes'] ?? '')
            ]
        );

        if ($id) {
            // Send notification to the client
            try {
                $notifController = new NotificationsController();
                $notifController->create([
                    'user_id'   => (int)$data['client_id'],
                    'user_role' => 'client',
                    'type'      => 'info',
                    'message' => "📄 Une nouvelle facture a été générée pour votre projet. [invoice_id:{$id}]"
                ]);
            } catch (Exception $e) {
                // Silently fail notification if it errors out
            }
        }

        return ['success' => (bool)$id, 'id' => $id];
    }

    public function updateInvoice($id, $data)
    {
        $result = $this->sql->update(
            "UPDATE invoices SET project_id=:project_id, client_id=:client_id, amount=:amount, due_date=:due_date, issued_date=:issued_date, status=:status, notes=:notes WHERE id=:id",
            [
                ':project_id'  => (int)$data['project_id'],
                ':client_id'   => (int)$data['client_id'],
                ':amount'      => (float)$data['amount'],
                ':due_date'    => $data['due_date'] ?? null,
                ':issued_date' => $data['issued_date'] ?? null,
                ':status'      => $data['status'] ?? 'draft',
                ':notes'       => htmlspecialchars($data['notes'] ?? ''),
                ':id'          => $id
            ]
        );
        return ['success' => $result];
    }

    public function deleteInvoice($id)
    {
        $result = $this->sql->delete("DELETE FROM invoices WHERE id = :id", [':id' => $id]);
        return ['success' => $result];
    }

    // --- Payments Methods ---

    public function getAllPayments($user = null)
    {
        global $userData;
        $currentUser = $user ?? $userData ?? null;
        $isTester = TesterHelper::isTester($currentUser);
        $testerClientId = TesterHelper::getTesterClientId($this->sql->getPdo());

        $sql = "SELECT pay.*, c.name as client_name, p.name as project_name 
                FROM payments pay 
                JOIN clients c ON pay.client_id = c.id 
                JOIN projects p ON pay.project_id = p.id";
        $params = [];
        $where = [];

        if ($currentUser && isset($currentUser['role']) && $currentUser['role'] === 'client') {
            $where[] = "pay.client_id = :user_cid";
            $params['user_cid'] = (int)$currentUser['id'];
        } elseif ($isTester) {
            $where[] = "pay.client_id = :tester_cid";
            $params['tester_cid'] = $testerClientId;
        } else {
            // Super Admin
            $where[] = "pay.client_id != :tester_cid";
            $params['tester_cid'] = $testerClientId;
        }

        if (!empty($where)) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }

        $sql .= " ORDER BY pay.created_at DESC";

        return $this->sql->getAll($sql, $params);
    }

    public function recordPayment($data, $user = null)
    {
        global $userData;
        $currentUser = $user ?? $userData ?? null;
        $isTester = TesterHelper::isTester($currentUser);
        $testerClientId = TesterHelper::getTesterClientId($this->sql->getPdo());

        if ($isTester) {
            $data['client_id'] = $testerClientId;
        }

        $pdo = $this->sql->getPdo();
        
        try {
            $pdo->beginTransaction();

            // 1. Insert Payment
            $stmt = $pdo->prepare("
                INSERT INTO payments (project_id, client_id, invoice_id, amount, payment_date, payment_method, notes) 
                VALUES (:project_id, :client_id, :invoice_id, :amount, :payment_date, :payment_method, :notes)
            ");
            
            $stmt->execute([
                ':project_id' => (int)$data['project_id'],
                ':client_id' => (int)$data['client_id'],
                ':invoice_id' => !empty($data['invoice_id']) ? (int)$data['invoice_id'] : null,
                ':amount' => (float)$data['amount'],
                ':payment_date' => $data['payment_date'] ?? date('Y-m-d'),
                ':payment_method' => $data['payment_method'] ?? 'transfer',
                ':notes' => htmlspecialchars($data['notes'] ?? '')
            ]);

            $paymentId = $pdo->lastInsertId();

            // Audit Log
            $this->logger->log($currentUser['id'] ?? 0, 'create', 'payment', $paymentId, null, $data);

            $pdo->commit();
            return ['success' => true, 'id' => $paymentId];

        } catch (Exception $e) {
            $pdo->rollBack();
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function updatePayment($id, $data)
    {
        // Triggers in the database will automatically re-calculate the project remaining amount upon UPDATE
        $result = $this->sql->update(
            "UPDATE payments SET project_id=:project_id, client_id=:client_id, invoice_id=:invoice_id, amount=:amount, payment_date=:payment_date, payment_method=:payment_method, notes=:notes WHERE id=:id",
            [
                ':project_id' => (int)$data['project_id'],
                ':client_id' => (int)$data['client_id'],
                ':invoice_id' => !empty($data['invoice_id']) ? (int)$data['invoice_id'] : null,
                ':amount' => (float)$data['amount'],
                ':payment_date' => $data['payment_date'] ?? date('Y-m-d'),
                ':payment_method' => $data['payment_method'] ?? 'transfer',
                ':notes' => htmlspecialchars($data['notes'] ?? ''),
                ':id' => $id
            ]
        );
        return ['success' => $result];
    }

    public function deletePayment($id)
    {
        $pdo = $this->sql->getPdo();
        $payment = $this->sql->getId("SELECT project_id, invoice_id FROM payments WHERE id = :id", [':id' => $id]);
        
        if (!$payment) return ['success' => false, 'error' => 'Payment not found'];

        try {
            $pdo->beginTransaction();

            $this->sql->delete("DELETE FROM payments WHERE id = :id", [':id' => $id]);
            $pdo->commit();
            return ['success' => true];
        } catch (Exception $e) {
            $pdo->rollBack();
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
