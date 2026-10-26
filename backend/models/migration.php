<?php

require_once __DIR__ . '/../routes/config.php';

$status = [];

function addStatus(string $type, string $key, string $message): void
{
    global $status;
    $status[] = ["status" => $type, $key => $message];
}

function createDatabase(): void
{
    try {
        $conn = getPDOConnectionDB(false);
        $conn->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME . "
                     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        addStatus("success", "database", "Database created or already exists.");
    } catch (PDOException $e) {
        addStatus("error", "database", "Database creation failed: " . $e->getMessage());
        exit;
    }
}

function createTables(): string
{
    global $status;

    try {
        createDatabase();
        $conn = getPDOConnectionDB();

        // DROP TABLES IN REVERSE ORDER TO AVOID FK ISSUES
        $conn->exec("SET FOREIGN_KEY_CHECKS = 0;");
        $tablesToDrop = [
            'notifications', 'activity_logs', 'payments', 'invoices', 
            'tasks', 'services', 'projects', 'clients', 'admin'
        ];
        foreach ($tablesToDrop as $table) {
            $conn->exec("DROP TABLE IF EXISTS $table");
        }
        $conn->exec("SET FOREIGN_KEY_CHECKS = 1;");
        addStatus("success", "cleanup", "Existing tables dropped for clean migration.");

        // 1. Admin Table
        $conn->exec("CREATE TABLE IF NOT EXISTS admin (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            username   VARCHAR(100)  NOT NULL UNIQUE,
            name       VARCHAR(255)  NOT NULL,
            password   VARCHAR(255)  NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB");
        addStatus("success", "admin", "Table 'admin' OK.");

        // 2. Clients Table
        $conn->exec("CREATE TABLE IF NOT EXISTS clients (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            name       VARCHAR(255) NOT NULL,
            username   VARCHAR(100) UNIQUE,
            password   VARCHAR(255),
            phone      VARCHAR(50),
            email      VARCHAR(255) NOT NULL UNIQUE,
            address    TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX (username),
            INDEX (email)
        ) ENGINE=InnoDB");
        addStatus("success", "clients", "Table 'clients' OK.");


        // 3. Projects
        $conn->exec("CREATE TABLE IF NOT EXISTS projects (
            id               INT AUTO_INCREMENT PRIMARY KEY,
            name             VARCHAR(255) NOT NULL,
            description      TEXT,
            start_date       DATE,
            end_date         DATE,
            status           ENUM('pending', 'in_progress', 'completed', 'cancelled', 'overdue') NOT NULL DEFAULT 'pending',
            progress         DECIMAL(5,2) NOT NULL DEFAULT 0.00,
            total_cost       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            remaining_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            rejection_note   TEXT NULL,
            client_id        INT NOT NULL,
            created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
            INDEX (status)
        ) ENGINE=InnoDB");
        addStatus("success", "projects", "Table 'projects' OK.");

        try {
            $conn->exec("ALTER TABLE projects ADD COLUMN rejection_note TEXT NULL AFTER remaining_amount");
            addStatus("success", "projects_alter", "Added 'rejection_note' column to 'projects'.");
        } catch (PDOException $e) {
            // Already exists
        }

        // 4. Services (Linked to Project)
        $conn->exec("CREATE TABLE IF NOT EXISTS services (
            id               INT AUTO_INCREMENT PRIMARY KEY,
            project_id       INT NOT NULL,
            name             VARCHAR(255) NOT NULL,
            price            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            duration_days    INT NOT NULL DEFAULT 0,
            description      TEXT,
            status           ENUM('pending', 'in_progress', 'completed', 'overdue', 'cancelled') NOT NULL DEFAULT 'pending',
            created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            INDEX (project_id)
        ) ENGINE=InnoDB");

        // Ensure 'description' column exists for users with older database versions
        try {
            $conn->exec("ALTER TABLE services ADD COLUMN description TEXT AFTER duration_days");
            addStatus("success", "services_alter", "Added 'description' column to 'services'.");
        } catch (PDOException $e) {
            // Probably already exists, ignore
        }
        addStatus("success", "services", "Table 'services' OK.");

        // 5. Tasks (Linked to Service)
        $conn->exec("CREATE TABLE IF NOT EXISTS tasks (
            id                 INT AUTO_INCREMENT PRIMARY KEY,
            service_id         INT NOT NULL,
            title              VARCHAR(255) NOT NULL,
            description        TEXT,
            start_date         DATE,
            end_date           DATE,
            priority           ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
            status             ENUM('todo', 'in_progress', 'done', 'overdue') NOT NULL DEFAULT 'todo',
            total_hours        DECIMAL(8,2)  NOT NULL DEFAULT 0.00,
            total_cost         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
            INDEX (service_id)
        ) ENGINE=InnoDB");
        addStatus("success", "tasks", "Table 'tasks' OK.");

        // 6. Subtasks (Linked to Task)
        $conn->exec("CREATE TABLE IF NOT EXISTS subtasks (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            task_id     INT NOT NULL,
            title       VARCHAR(255) NOT NULL,
            description TEXT,
            status      ENUM('todo', 'in_progress', 'done') NOT NULL DEFAULT 'todo',
            priority    ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            INDEX (task_id)
        ) ENGINE=InnoDB");
        addStatus("success", "subtasks", "Table 'subtasks' OK.");

        // TRIGGER: update parent task status based on subtasks
        foreach (['INSERT', 'UPDATE', 'DELETE'] as $event) {
            $ref    = ($event === 'DELETE') ? 'OLD' : 'NEW';
            $suffix = strtolower($event);
            $conn->exec("DROP TRIGGER IF EXISTS after_{$suffix}_subtask_status");
            $conn->exec("
                CREATE TRIGGER after_{$suffix}_subtask_status
                AFTER {$event} ON subtasks
                FOR EACH ROW
                BEGIN
                    DECLARE v_total INT;
                    DECLARE v_done INT;
                    DECLARE v_in_progress INT;
                    SELECT COUNT(*) INTO v_total FROM subtasks WHERE task_id = {$ref}.task_id;
                    SELECT COUNT(*) INTO v_done FROM subtasks WHERE task_id = {$ref}.task_id AND status = 'done';
                    SELECT COUNT(*) INTO v_in_progress FROM subtasks WHERE task_id = {$ref}.task_id AND status = 'in_progress';
                    IF v_total = 0 THEN
                        UPDATE tasks SET status = 'todo' WHERE id = {$ref}.task_id AND status != 'overdue';
                    ELSEIF v_total = v_done THEN
                        UPDATE tasks SET status = 'done' WHERE id = {$ref}.task_id;
                    ELSEIF v_in_progress > 0 OR v_done > 0 THEN
                        UPDATE tasks SET status = 'in_progress' WHERE id = {$ref}.task_id AND status NOT IN ('done', 'overdue');
                    END IF;
                END
            ");
        }
        addStatus("success", "triggers_subtasks", "Triggers on subtasks (task status rollup) OK.");

        // FINANCIAL & STATUS TRIGGERS: TASKS -> SERVICES
        foreach (['INSERT', 'UPDATE', 'DELETE'] as $event) {
            $ref    = ($event === 'DELETE') ? 'OLD' : 'NEW';
            $suffix = strtolower($event);
            
            $conn->exec("DROP TRIGGER IF EXISTS after_{$suffix}_task_financials");
            $conn->exec("
                CREATE TRIGGER after_{$suffix}_task_financials
                AFTER {$event} ON tasks
                FOR EACH ROW
                BEGIN
                    DECLARE v_status ENUM('pending', 'in_progress', 'completed');
                    DECLARE v_total_tasks INT;
                    DECLARE v_done_tasks INT;
                    DECLARE v_in_progress_tasks INT;

                    -- Update parent Service price based on tasks
                    UPDATE services 
                    SET price = (SELECT IFNULL(SUM(total_cost), 0) FROM tasks WHERE service_id = {$ref}.service_id)
                    WHERE id = {$ref}.service_id;

                    -- Calc statuses
                    SELECT COUNT(*) INTO v_total_tasks FROM tasks WHERE service_id = {$ref}.service_id;
                    SELECT COUNT(*) INTO v_done_tasks FROM tasks WHERE service_id = {$ref}.service_id AND status = 'done';
                    SELECT COUNT(*) INTO v_in_progress_tasks FROM tasks WHERE service_id = {$ref}.service_id AND status = 'in_progress';

                    IF v_total_tasks = 0 THEN
                        SET v_status = 'pending';
                    ELSEIF v_total_tasks = v_done_tasks THEN
                        SET v_status = 'completed';
                    ELSEIF v_in_progress_tasks > 0 OR v_done_tasks > 0 THEN
                        SET v_status = 'in_progress';
                    ELSE
                        SET v_status = 'pending';
                    END IF;

                    UPDATE services SET status = v_status WHERE id = {$ref}.service_id;
                END
            ");
        }
        addStatus("success", "triggers_tasks", "Financial and status triggers on tasks (cascading to services) OK.");

        // FINANCIAL TRIGGERS: SERVICES -> PROJECTS
        foreach (['INSERT', 'UPDATE', 'DELETE'] as $event) {
            $ref    = ($event === 'DELETE') ? 'OLD' : 'NEW';
            $suffix = strtolower($event);
            
            $conn->exec("DROP TRIGGER IF EXISTS after_{$suffix}_service_financials");
            $conn->exec("
                CREATE TRIGGER after_{$suffix}_service_financials
                AFTER {$event} ON services
                FOR EACH ROW
                BEGIN
                    -- Update project totals based on services
                    UPDATE projects SET
                        total_cost       = (SELECT IFNULL(SUM(price), 0) FROM services WHERE project_id = {$ref}.project_id),
                        remaining_amount = (SELECT IFNULL(SUM(price), 0) FROM services WHERE project_id = {$ref}.project_id)
                                         - (SELECT IFNULL(SUM(amount), 0) FROM payments WHERE project_id = {$ref}.project_id),
                        end_date         = DATE_ADD(start_date, INTERVAL (SELECT IFNULL(SUM(duration_days), 0) FROM services WHERE project_id = {$ref}.project_id) DAY),
                        progress         = (
                            CASE 
                                WHEN (SELECT COUNT(*) FROM services WHERE project_id = {$ref}.project_id) = 0 THEN 0
                                ELSE (SELECT COUNT(*) FROM services WHERE project_id = {$ref}.project_id AND status = 'completed') * 100.0 / (SELECT COUNT(*) FROM services WHERE project_id = {$ref}.project_id)
                            END
                        )
                    WHERE id = {$ref}.project_id;

                    -- Update project status based on services
                    BEGIN
                        DECLARE total_s INT;
                        DECLARE comp_s INT;
                        SELECT COUNT(*) INTO total_s FROM services WHERE project_id = {$ref}.project_id;
                        SELECT COUNT(*) INTO comp_s FROM services WHERE project_id = {$ref}.project_id AND status = 'completed';
                        
                        IF total_s > 0 AND comp_s = total_s THEN
                            UPDATE projects SET status = 'completed' WHERE id = {$ref}.project_id AND status != 'completed';
                        ELSEIF total_s > 0 AND comp_s > 0 THEN
                            UPDATE projects SET status = 'in_progress' WHERE id = {$ref}.project_id AND status = 'pending';
                        END IF;
                    END;
                END
            ");
        }
        addStatus("success", "triggers_services", "Financial triggers on services (cascading to projects) OK.");


        // 9. Invoices
        $conn->exec("CREATE TABLE IF NOT EXISTS invoices (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            project_id  INT NOT NULL,
            client_id   INT NOT NULL,
            amount      DECIMAL(10,2) NOT NULL,
            due_date    DATE,
            issued_date DATE DEFAULT (CURRENT_DATE),
            status      ENUM('draft', 'sent', 'paid', 'overdue') NOT NULL DEFAULT 'draft',
            notes       TEXT,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
            INDEX (project_id),
            INDEX (client_id)
        ) ENGINE=InnoDB");
        addStatus("success", "invoices", "Table 'invoices' OK.");

        // 10. Payments
        $conn->exec("CREATE TABLE IF NOT EXISTS payments (
            id             INT AUTO_INCREMENT PRIMARY KEY,
            project_id     INT NOT NULL,
            client_id      INT NOT NULL,
            invoice_id     INT NULL,
            amount         DECIMAL(10,2) NOT NULL,
            payment_date   DATE NOT NULL,
            payment_method ENUM('transfer', 'check', 'cash', 'card', 'other') DEFAULT 'transfer',
            notes          TEXT,
            created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
            INDEX (project_id),
            INDEX (invoice_id)
        ) ENGINE=InnoDB");
        addStatus("success", "payments", "Table 'payments' OK.");

        // FINANCIAL & INVOICE TRIGGERS ON PAYMENTS
        foreach (['INSERT', 'UPDATE', 'DELETE'] as $event) {
            $ref    = ($event === 'DELETE') ? 'OLD' : 'NEW';
            $suffix = strtolower($event);
            $conn->exec("DROP TRIGGER IF EXISTS after_{$suffix}_payment_financials");
            $conn->exec("
                CREATE TRIGGER after_{$suffix}_payment_financials
                AFTER {$event} ON payments
                FOR EACH ROW
                BEGIN
                    -- Update Project remaining_amount
                    UPDATE projects SET
                        remaining_amount = total_cost - (SELECT IFNULL(SUM(amount), 0) FROM payments WHERE project_id = {$ref}.project_id)
                    WHERE id = {$ref}.project_id;

                    -- Auto-update Invoice status if paid in full
                    IF {$ref}.invoice_id IS NOT NULL THEN
                        IF (SELECT IFNULL(SUM(amount), 0) FROM payments WHERE invoice_id = {$ref}.invoice_id) >= 
                           (SELECT amount FROM invoices WHERE id = {$ref}.invoice_id) THEN
                            UPDATE invoices SET status = 'paid' WHERE id = {$ref}.invoice_id;
                        ELSE
                            UPDATE invoices SET status = 'sent' WHERE id = {$ref}.invoice_id AND status = 'paid';
                        END IF;
                    END IF;
                END
            ");
        }
        addStatus("success", "triggers_payments", "Financial triggers on payments (projects and invoices) OK.");

        // 11. Activity Logs (Polymorphic)
        $conn->exec("CREATE TABLE IF NOT EXISTS activity_logs (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            user_id    INT NOT NULL,
            action     ENUM('create', 'update', 'delete', 'login', 'logout') NOT NULL,
            entity_type VARCHAR(100) NOT NULL,
            entity_id  INT NOT NULL,
            old_value  JSON,
            new_value  JSON,
            ip_address VARCHAR(45),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (entity_type, entity_id),
            INDEX (user_id)
        ) ENGINE=InnoDB");
        addStatus("success", "activity_logs", "Table 'activity_logs' OK.");

        // 12. Notifications
        $conn->exec("CREATE TABLE IF NOT EXISTS notifications (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            user_id     INT NOT NULL,
            type        ENUM('info', 'warning', 'error', 'success') NOT NULL,
            message     TEXT NOT NULL,
            is_read     BOOLEAN NOT NULL DEFAULT FALSE,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (user_id),
            INDEX (is_read)
        ) ENGINE=InnoDB");
        addStatus("success", "notifications", "Table 'notifications' OK.");

        try {
            $conn->exec("ALTER TABLE notifications ADD COLUMN user_role ENUM('admin', 'client') NOT NULL DEFAULT 'client' AFTER user_id");
            addStatus("success", "notifications_alter", "Added 'user_role' column to 'notifications'.");
        } catch (PDOException $e) {
            // Already exists
        }

        // CLEANUP: Drop old tables
        $conn->exec("DROP TABLE IF EXISTS work_logs");
        $conn->exec("DROP TABLE IF EXISTS tache");
        $conn->exec("DROP TABLE IF EXISTS offers");
        $conn->exec("DROP TABLE IF EXISTS offer_servers");
        addStatus("success", "cleanup", "Legacy tables dropped.");

        // DEFAULT DATA (Seed)
        $adminPass = password_hash('admin123', PASSWORD_BCRYPT);
        $demoAdminPass = password_hash('tester123', PASSWORD_BCRYPT);
        $testerPass = password_hash('tester123', PASSWORD_BCRYPT);
        $clientPass = password_hash('client123', PASSWORD_BCRYPT);
        $userPass = password_hash('user', PASSWORD_BCRYPT);
        
        $conn->exec("INSERT IGNORE INTO admin (username, name, password) VALUES ('admin', 'OMAR OUKADDOUR', '$adminPass')");
        $conn->exec("INSERT IGNORE INTO admin (username, name, password) VALUES ('admin_tester', 'Admin Testeur (Direction)', '$demoAdminPass')");
        $conn->exec("INSERT IGNORE INTO admin (username, name, password) VALUES ('directeur_demo', 'Direction Démo (PFE)', '$demoAdminPass')");
        $conn->exec("INSERT IGNORE INTO clients (name, username, password, email, phone) VALUES ('Client Testeur Démo', 'user_tester', '$testerPass', 'user_tester@kalyo.ma', '0600112233')");
        $conn->exec("INSERT IGNORE INTO clients (name, username, password, email, phone) VALUES ('Client Default', 'client', '$clientPass', 'client@default.com', '0600000000')");
        $conn->exec("INSERT IGNORE INTO clients (name, username, password, email, phone) VALUES ('Test User', 'user', '$userPass', 'user@test.com', '0611111111')");
        addStatus("success", "seed", "Default Admin, Directeur Démo, Client, and Test User created.");

    } catch (PDOException $e) {
        addStatus("error", "general", "Process Error : " . $e->getMessage());
    }

    return json_encode($status, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

function renderCreationHtml(array $statusList): string
{
    ob_start();
    ?>
    <!DOCTYPE html>
    <html lang="fr" dir="ltr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kalyo OS • Création & Migration Base de Données</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
            body { background-color: #0B0F19; color: #F8FAFC; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
            .container { width: 100%; max-width: 820px; background: #111827; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 36px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
            .brand { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 24px; margin-bottom: 28px; }
            .brand-left { display: flex; align-items: center; gap: 14px; }
            .logo-prism { width: 44px; height: 44px; background: linear-gradient(135deg, #6366F1 0%, #06B6D4 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 22px; color: #FFF; box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
            .brand-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
            .brand-subtitle { font-size: 13px; color: #94A3B8; font-weight: 500; }
            .badge-status { padding: 8px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; border: 1px solid #10B981; color: #10B981; background: rgba(16, 185, 129, 0.1); }
            .details-box { background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 20px; margin-bottom: 28px; font-size: 13px; max-height: 280px; overflow-y: auto; }
            .details-box ul { list-style: none; padding: 0; }
            .details-box li { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
            .details-box li:last-child { border-bottom: none; }
            .log-success { color: #34D399; font-weight: 600; }
            .log-key { color: #94A3B8; font-family: monospace; }
            .actions-bar { display: flex; flex-wrap: wrap; gap: 12px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px; }
            .btn { flex: 1; min-width: 170px; padding: 12px 18px; border-radius: 12px; text-decoration: none; font-size: 13.5px; font-weight: 700; text-align: center; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
            .btn-primary { background: #6366F1; color: #FFF; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3); }
            .btn-primary:hover { background: #4F46E5; }
            .btn-secondary { background: #1E293B; color: #F8FAFC; border: 1px solid rgba(255,255,255,0.1); }
            .btn-secondary:hover { background: #334155; }
            .btn-success { background: #10B981; color: #FFF; }
            .btn-success:hover { background: #059669; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="brand">
                <div class="brand-left">
                    <div class="logo-prism">K</div>
                    <div>
                        <div class="brand-title">KALYO DATABASE SCHEMA</div>
                        <div class="brand-subtitle">Création & Déploiement des 10 Tables et Triggers MySQL</div>
                    </div>
                </div>
                <div class="badge-status">
                    ● SCHÉMA INITIALISÉ AVEC SUCCÈS
                </div>
            </div>

            <div class="details-box">
                <div style="font-weight: 700; color: #FFF; margin-bottom: 12px; font-size: 14px;">
                    ⚡ Déploiement des tables, clés étrangères et triggers :
                </div>
                <ul>
                    <?php foreach ($statusList as $item): ?>
                        <li>
                            <span class="log-key"><?= htmlspecialchars(key($item) === 'status' ? next($item) : reset($item)) ?></span>
                            <span class="log-success">✓ <?= htmlspecialchars(end($item)) ?></span>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </div>

            <div class="actions-bar">
                <a href="?page=factory" class="btn btn-primary">⚡ Remplir avec la Factory (Données Réelles)</a>
                <a href="?page=database" class="btn btn-secondary">🔄 Relancer la Création</a>
                <a href="http://localhost:5173/login/admin" target="_blank" class="btn btn-success">👑 Portail Admin</a>
                <a href="http://localhost:5173/login/client" target="_blank" class="btn btn-secondary">👤 Portail Client</a>
            </div>
        </div>
    </body>
    </html>
    <?php
    return ob_get_clean();
}