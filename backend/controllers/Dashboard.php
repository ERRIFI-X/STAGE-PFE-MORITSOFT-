<?php

require_once __DIR__ . '/../models/Sql.php';
require_once __DIR__ . '/../models/TesterHelper.php';

class Dashboard
{
    private $sql;

    public function __construct()
    {
        $this->sql = new Sql();
    }

    public function getSummary($user = null)
    {
        try {
            global $userData;
            $currentUser = $user ?? $userData ?? null;
            $isTester = TesterHelper::isTester($currentUser);
            $testerClientId = TesterHelper::getTesterClientId($this->sql->getPdo());

            if ($isTester) {
                // Isolated metrics exclusively for tester
                $clientsCount = 1;

                $projData = $this->sql->getId(
                    "SELECT COUNT(*) as count, IFNULL(SUM(total_cost), 0) as total_budget, IFNULL(SUM(remaining_amount), 0) as total_remaining FROM projects WHERE client_id = :cid",
                    [':cid' => $testerClientId]
                );
                $projectsCount = (int)($projData['count'] ?? 0);
                $totalBudget = (float)($projData['total_budget'] ?? 0);
                $totalRemaining = (float)($projData['total_remaining'] ?? 0);

                $tasksData = $this->sql->getId("
                    SELECT COUNT(t.id) as count 
                    FROM tasks t 
                    JOIN services s ON t.service_id = s.id 
                    JOIN projects p ON s.project_id = p.id 
                    WHERE p.client_id = :cid
                ", [':cid' => $testerClientId]);
                $tasksCount = (int)($tasksData['count'] ?? 0);

                $invoicesData = $this->sql->getId("SELECT COUNT(*) as count FROM invoices WHERE client_id = :cid", [':cid' => $testerClientId]);
                $invoicesCount = (int)($invoicesData['count'] ?? 0);

                $revenueData = $this->sql->getId("SELECT IFNULL(SUM(amount), 0) as total FROM payments WHERE client_id = :cid", [':cid' => $testerClientId]);
                $totalRevenue = (float)($revenueData['total'] ?? 0);

                $statusDistribution = [
                    'pending' => 0, 'in_progress' => 0, 'completed' => 0, 'cancelled' => 0, 'overdue' => 0
                ];
                $projectStatusResults = $this->sql->getAll(
                    "SELECT status, COUNT(*) as count FROM projects WHERE client_id = :cid GROUP BY status",
                    [':cid' => $testerClientId]
                );
                if (is_array($projectStatusResults)) {
                    foreach ($projectStatusResults as $row) {
                        $statusDistribution[$row['status']] = (int)$row['count'];
                    }
                }

                $overdueData = $this->sql->getId("
                    SELECT COUNT(*) as count FROM projects 
                    WHERE client_id = :cid AND (status = 'overdue' OR (end_date IS NOT NULL AND end_date < CURDATE() AND status NOT IN ('completed', 'cancelled')))
                ", [':cid' => $testerClientId]);
                $overdueCount = (int)($overdueData['count'] ?? 0);

                $monthlyRevenue = $this->sql->getAll("
                    SELECT 
                        DATE_FORMAT(payment_date, '%Y-%m') as ym,
                        DATE_FORMAT(payment_date, '%b %Y') as label,
                        SUM(amount) as total
                    FROM payments
                    WHERE client_id = :cid AND payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                    GROUP BY DATE_FORMAT(payment_date, '%Y-%m'), DATE_FORMAT(payment_date, '%b %Y')
                    ORDER BY ym ASC
                ", [':cid' => $testerClientId]);

                $recentActivities = $this->sql->getAll("
                    SELECT a.id, a.action, a.entity_type, a.entity_id, a.created_at, IFNULL(admin.name, 'Admin Testeur') as user_name
                    FROM activity_logs a
                    LEFT JOIN admin ON a.user_id = admin.id
                    WHERE a.user_id = :uid
                    ORDER BY a.created_at DESC
                    LIMIT 8
                ", [':uid' => (int)($currentUser['id'] ?? 0)]);

                return [
                    'success' => true,
                    'data' => [
                        'total_clients' => 1,
                        'total_projects' => $projectsCount,
                        'total_tasks' => $tasksCount,
                        'total_invoices' => $invoicesCount,
                        'total_revenue' => $totalRevenue,
                        'total_budget' => $totalBudget,
                        'total_remaining' => $totalRemaining,
                        'overdue_count' => $overdueCount,
                        'project_status' => $statusDistribution,
                        'monthly_revenue' => is_array($monthlyRevenue) ? $monthlyRevenue : [],
                        'recent_activities' => is_array($recentActivities) ? $recentActivities : [],
                        'is_tester' => true,
                        'tester_quota' => [
                            'projects_count' => $projectsCount,
                            'projects_max' => 3,
                            'clients_count' => 1,
                            'clients_max' => 1
                        ]
                    ]
                ];
            }

            // Super Admin: official agency metrics (excluding tester client)
            $clientsCount = $this->sql->getId("SELECT COUNT(*) as count FROM clients WHERE id != :tid", [':tid' => $testerClientId])['count'] ?? 0;
            $projectsCount = $this->sql->getId("SELECT COUNT(*) as count FROM projects WHERE client_id != :tid", [':tid' => $testerClientId])['count'] ?? 0;
            $tasksCount = $this->sql->getId("
                SELECT COUNT(t.id) as count 
                FROM tasks t 
                JOIN services s ON t.service_id = s.id 
                JOIN projects p ON s.project_id = p.id 
                WHERE p.client_id != :tid
            ", [':tid' => $testerClientId])['count'] ?? 0;
            $invoicesCount = $this->sql->getId("SELECT COUNT(*) as count FROM invoices WHERE client_id != :tid", [':tid' => $testerClientId])['count'] ?? 0;
            
            $revenueData = $this->sql->getId("SELECT SUM(amount) as total FROM payments WHERE client_id != :tid", [':tid' => $testerClientId]);
            $totalRevenue = (float)($revenueData['total'] ?? 0);

            $budgetData = $this->sql->getId("SELECT IFNULL(SUM(total_cost), 0) as total_budget, IFNULL(SUM(remaining_amount), 0) as total_remaining FROM projects WHERE client_id != :tid", [':tid' => $testerClientId]);
            $totalBudget = (float)($budgetData['total_budget'] ?? 0);
            $totalRemaining = (float)($budgetData['total_remaining'] ?? 0);

            $projectStatusResults = $this->sql->getAll("SELECT status, COUNT(*) as count FROM projects WHERE client_id != :tid GROUP BY status", [':tid' => $testerClientId]);
            $statusDistribution = [
                'pending' => 0,
                'in_progress' => 0,
                'completed' => 0,
                'cancelled' => 0,
                'overdue' => 0
            ];
            if (is_array($projectStatusResults)) {
                foreach ($projectStatusResults as $row) {
                    $statusDistribution[$row['status']] = (int)$row['count'];
                }
            }

            $overdueData = $this->sql->getId("
                SELECT COUNT(*) as count FROM projects 
                WHERE client_id != :tid AND (status = 'overdue' OR (end_date IS NOT NULL AND end_date < CURDATE() AND status NOT IN ('completed', 'cancelled')))
            ", [':tid' => $testerClientId]);
            $overdueCount = (int)($overdueData['count'] ?? 0);

            $monthlyRevenue = $this->sql->getAll("
                SELECT 
                    DATE_FORMAT(payment_date, '%Y-%m') as ym,
                    DATE_FORMAT(payment_date, '%b %Y') as label,
                    SUM(amount) as total
                FROM payments
                WHERE client_id != :tid AND payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(payment_date, '%Y-%m'), DATE_FORMAT(payment_date, '%b %Y')
                ORDER BY ym ASC
            ", [':tid' => $testerClientId]);

            $recentActivities = $this->sql->getAll("
                SELECT a.id, a.action, a.entity_type, a.entity_id, a.created_at, IFNULL(admin.name, 'Admin') as user_name
                FROM activity_logs a
                LEFT JOIN admin ON a.user_id = admin.id
                ORDER BY a.created_at DESC
                LIMIT 8
            ");

            return [
                'success' => true,
                'data' => [
                    'total_clients' => (int)$clientsCount,
                    'total_projects' => (int)$projectsCount,
                    'total_tasks' => (int)$tasksCount,
                    'total_invoices' => (int)$invoicesCount,
                    'total_revenue' => $totalRevenue,
                    'total_budget' => $totalBudget,
                    'total_remaining' => $totalRemaining,
                    'overdue_count' => $overdueCount,
                    'project_status' => $statusDistribution,
                    'monthly_revenue' => is_array($monthlyRevenue) ? $monthlyRevenue : [],
                    'recent_activities' => is_array($recentActivities) ? $recentActivities : [],
                    'is_tester' => false
                ]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
