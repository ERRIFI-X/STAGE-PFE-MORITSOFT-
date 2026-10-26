<?php

require_once __DIR__ . '/../routes/config.php';
require_once __DIR__ . '/migration.php';

function runFactory(bool $resetFirst = true): array
{
    $results = [
        'success' => true,
        'message' => 'Factory exécutée avec succès.',
        'entities' => [],
        'stats' => []
    ];

    try {
        $conn = getPDOConnectionDB();

        // 1. Assurer que les tables existent
        $tablesCheck = $conn->query("SHOW TABLES LIKE 'projects'")->fetchAll();
        if (empty($tablesCheck)) {
            createTables();
        }

        // 2. Nettoyage complet si demandé (Truncate propre)
        if ($resetFirst) {
            $conn->exec("SET FOREIGN_KEY_CHECKS = 0;");
            $tablesToTruncate = [
                'notifications', 'activity_logs', 'payments', 'invoices',
                'subtasks', 'tasks', 'services', 'projects', 'clients', 'admin'
            ];
            foreach ($tablesToTruncate as $t) {
                $conn->exec("TRUNCATE TABLE $t");
            }
            $conn->exec("SET FOREIGN_KEY_CHECKS = 1;");
            $results['entities'][] = "Toutes les tables ont été réinitialisées (TRUNCATE propre).";
        }

        // ==========================================
        // 3. ADMINS
        // ==========================================
        $adminPass = password_hash('admin123', PASSWORD_BCRYPT);
        $testerPass = password_hash('tester123', PASSWORD_BCRYPT);
        $stmt = $conn->prepare("INSERT INTO admin (username, name, password) VALUES (?, ?, ?)");
        $stmt->execute(['admin', 'OMAR OUKADDOUR (Direction)', $adminPass]);
        $stmt->execute(['admin_tester', 'Admin Testeur (Direction)', $testerPass]);
        $stmt->execute(['directeur_demo', 'Direction Démo (PFE)', $testerPass]);
        $results['stats']['admin'] = 3;

        // ==========================================
        // 4. CLIENTS RÉELS & CLIENT TESTEUR
        // ==========================================
        $clientPass2026 = password_hash('Client@2026', PASSWORD_BCRYPT);
        $clientPass123  = password_hash('client123', PASSWORD_BCRYPT);
        $userPass       = password_hash('tester123', PASSWORD_BCRYPT);

        $clientsData = [
            [
                'name' => 'Maroc Digital Logistics SARL',
                'username' => 'maroc_logistics',
                'password' => $clientPass2026,
                'email' => 'contact@maroclogistics.ma',
                'phone' => '+212 5 22 88 99 00',
                'address' => 'Angle Bd d\'Anfa et Zerktouni, Casablanca, Maroc'
            ],
            [
                'name' => 'Atlas FinTech Solutions SA',
                'username' => 'atlas_fintech',
                'password' => $clientPass2026,
                'email' => 'direction@atlasfintech.ma',
                'phone' => '+212 5 22 40 10 20',
                'address' => 'Tour Casa Business Marina, Casablanca Finance City, Maroc'
            ],
            [
                'name' => 'Sahara Agro Export SARL',
                'username' => 'sahara_agro',
                'password' => $clientPass2026,
                'email' => 'export@sahara-agro.ma',
                'phone' => '+212 5 28 84 55 66',
                'address' => 'Zone Industrielle Anza, Agadir, Maroc'
            ],
            [
                'name' => 'Client Testeur Démo',
                'username' => 'user_tester',
                'password' => $userPass,
                'email' => 'user_tester@kalyo.ma',
                'phone' => '+212 6 00 11 22 33',
                'address' => 'Angle Bd Zerktouni, Casablanca, Maroc'
            ],
            [
                'name' => 'Kalyo Test Partner',
                'username' => 'client',
                'password' => $clientPass123,
                'email' => 'client@kalyo.ma',
                'phone' => '+212 6 61 00 00 00',
                'address' => 'Avenue de France, Agdal, Rabat, Maroc'
            ],
            [
                'name' => 'Portail Démo Utilisateur',
                'username' => 'user',
                'password' => $userPass,
                'email' => 'user@test.com',
                'phone' => '+212 6 11 11 11 11',
                'address' => 'Boulevard Mohammed VI, Gueliz, Marrakech, Maroc'
            ]
        ];

        $stmtClient = $conn->prepare("INSERT INTO clients (name, username, password, email, phone, address) VALUES (?, ?, ?, ?, ?, ?)");
        $clientIds = [];
        foreach ($clientsData as $c) {
            $stmtClient->execute([$c['name'], $c['username'], $c['password'], $c['email'], $c['phone'], $c['address']]);
            $clientIds[$c['username']] = (int)$conn->lastInsertId();
        }
        $results['stats']['clients'] = count($clientsData);

        // ==========================================
        // 5. PROJETS, SERVICES & TÂCHES
        // ==========================================

        // --- PROJET 1 : Maroc Digital Logistics ---
        $stmtProj = $conn->prepare("INSERT INTO projects (name, description, start_date, end_date, status, progress, client_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
        
        $stmtProj->execute([
            'Portail IoT & Suivi de Flotte B2B',
            'Plateforme SaaS temps réel de traçabilité GPS, gestion du carburant et affectation dynamique des tournées de livraison.',
            date('Y-m-d', strtotime('-12 days')),
            date('Y-m-d', strtotime('+20 days')),
            'in_progress',
            35.00,
            $clientIds['maroc_logistics']
        ]);
        $proj1_id = (int)$conn->lastInsertId();

        // Services Projet 1
        $stmtServ = $conn->prepare("INSERT INTO services (project_id, name, price, duration_days, description, status) VALUES (?, ?, ?, ?, ?, ?)");
        $stmtServ->execute([$proj1_id, 'Architecture Cloud & API REST de Télémétrie', 25000.00, 10, 'Conception microservices Docker, API REST sécurisée JWT et ingestion télématique GPS haute fréquence.', 'completed']);
        $serv1_1_id = (int)$conn->lastInsertId();

        $stmtServ->execute([$proj1_id, 'Interface Dashboard Web Temps Réel React', 35000.00, 15, 'Console de supervision cartographique Mapbox, alertes carburant et métriques de flotte.', 'in_progress']);
        $serv1_2_id = (int)$conn->lastInsertId();

        $stmtServ->execute([$proj1_id, 'Application Mobile Android Chauffeurs', 20000.00, 10, 'Application mobile chauffeur avec validation des bons de livraison, signature électronique et guidage GPS.', 'pending']);
        $serv1_3_id = (int)$conn->lastInsertId();

        // Tâches Service 1.1
        $stmtTask = $conn->prepare("INSERT INTO tasks (service_id, title, description, start_date, end_date, priority, status, total_hours, total_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmtTask->execute([$serv1_1_id, 'Mise en place broker MQTT & InfluxDB', 'Serveur de télémétrie pour capteurs GPS', date('Y-m-d', strtotime('-10 days')), date('Y-m-d', strtotime('-6 days')), 'high', 'done', 20.0, 12000.00]);
        $stmtTask->execute([$serv1_1_id, 'Endpoints REST de géolocalisation sécurisés', 'Contrôleurs PHP & JWT', date('Y-m-d', strtotime('-5 days')), date('Y-m-d', strtotime('-2 days')), 'urgent', 'done', 22.0, 13000.00]);

        // Tâches Service 1.2
        $stmtTask->execute([$serv1_2_id, 'Console Cartographique Mapbox GL', 'Affichage des marqueurs de camions en déplacement', date('Y-m-d', strtotime('-2 days')), date('Y-m-d', strtotime('+5 days')), 'high', 'in_progress', 30.0, 18000.00]);
        $stmtTask->execute([$serv1_2_id, 'Module Rapports de Consommation de Carburant', 'Exports Excel et PDF graphiques', date('Y-m-d', strtotime('+6 days')), date('Y-m-d', strtotime('+12 days')), 'medium', 'todo', 25.0, 17000.00]);

        // --- PROJET 2 : Atlas FinTech Solutions ---
        $stmtProj->execute([
            'Application Mobile Banking & Wallet',
            'Solution bancaire mobile nouvelle génération avec virements instantanés, QR Pay et gestion de cartes virtuelles sécurisées.',
            date('Y-m-d', strtotime('-15 days')),
            date('Y-m-d', strtotime('+30 days')),
            'in_progress',
            25.00,
            $clientIds['atlas_fintech']
        ]);
        $proj2_id = (int)$conn->lastInsertId();

        $stmtServ->execute([$proj2_id, 'Conception UX/UI & Prototypage Figma', 30000.00, 12, 'Design system bancaire complet et tests utilisateurs certifiés ergonomie.', 'completed']);
        $serv2_1_id = (int)$conn->lastInsertId();

        $stmtServ->execute([$proj2_id, 'Module Wallet & Authentification Biométrique', 55000.00, 20, 'Intégration Secure Enclave, FaceID/TouchID et passerelle interbancaire.', 'in_progress']);
        $serv2_2_id = (int)$conn->lastInsertId();

        $stmtServ->execute([$proj2_id, 'Audit de Sécurité OWASP & Tests de Pénétration', 35000.00, 8, 'Revue de code exhaustive et certification de conformité PCI-DSS.', 'pending']);
        $serv2_3_id = (int)$conn->lastInsertId();

        // --- PROJET 3 : Sahara Agro Export --- (En attente d'accord)
        $stmtProj->execute([
            'Plateforme ERP Traçabilité Agricole',
            'Plateforme de gestion globale des parcelles, serres d\'agrumes et chaîne du froid pour l\'export vers le marché européen.',
            date('Y-m-d', strtotime('+3 days')),
            date('Y-m-d', strtotime('+40 days')),
            'pending',
            0.00,
            $clientIds['sahara_agro']
        ]);
        $proj3_id = (int)$conn->lastInsertId();

        $stmtServ->execute([$proj3_id, 'Module Gestion des Parcelles & Rendements', 35000.00, 14, 'Suivi agronomique et alertes météo connectées.', 'pending']);
        $stmtServ->execute([$proj3_id, 'Génération QR Code Export & Certificats Phyto', 30000.00, 10, 'Automatisation des liasses d\'exportation ONSSA.', 'pending']);

        // --- PROJET 4 : Sahara Agro Export --- (Terminé & Soldé)
        $stmtProj->execute([
            'Portail E-Commerce B2B Terroir Marocain',
            'Boutique de distribution en gros d\'huiles d\'argan et safran certifiés avec passerelle de paiement multidevises.',
            date('Y-m-d', strtotime('-50 days')),
            date('Y-m-d', strtotime('-5 days')),
            'completed',
            100.00,
            $clientIds['sahara_agro']
        ]);
        $proj4_id = (int)$conn->lastInsertId();

        $stmtServ->execute([$proj4_id, 'Boutique B2B Multidevises & Passerelle CMI', 45000.00, 15, 'Catalogue grossiste et paiement sécurisé par carte marocaine et internationale.', 'completed']);

        $results['stats']['projects'] = 4;
        $results['stats']['services'] = 9;

        // ==========================================
        // 6. FACTURES (INVOICES)
        // ==========================================
        $stmtInv = $conn->prepare("INSERT INTO invoices (project_id, client_id, amount, due_date, issued_date, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");

        // Facture 1 : Acompte Projet 1 (40 000 DH - Payée)
        $stmtInv->execute([$proj1_id, $clientIds['maroc_logistics'], 40000.00, date('Y-m-d', strtotime('+10 days')), date('Y-m-d', strtotime('-8 days')), 'paid', "Facture d'acompte 50% de démarrage du projet IoT"]);
        $inv1_id = (int)$conn->lastInsertId();

        // Facture 2 : Acompte Projet 2 (60 000 DH - Payée)
        $stmtInv->execute([$proj2_id, $clientIds['atlas_fintech'], 60000.00, date('Y-m-d', strtotime('+5 days')), date('Y-m-d', strtotime('-12 days')), 'paid', "Acompte 50% Phase 1 Mobile Banking"]);
        $inv2_id = (int)$conn->lastInsertId();

        // Facture 3 : Solde Projet 2 (60 000 DH - Envoyée / À Régler)
        $stmtInv->execute([$proj2_id, $clientIds['atlas_fintech'], 60000.00, date('Y-m-d', strtotime('+20 days')), date('Y-m-d', strtotime('-2 days')), 'sent', "Facture de solde 50% à la livraison"]);
        $inv3_id = (int)$conn->lastInsertId();

        // Facture 4 : Acompte Projet 3 (32 500 DH - Envoyée)
        $stmtInv->execute([$proj3_id, $clientIds['sahara_agro'], 32500.00, date('Y-m-d', strtotime('+15 days')), date('Y-m-d'), 'sent', "Devis validé & appel de fonds acompte 50%"]);
        $inv4_id = (int)$conn->lastInsertId();

        // Facture 5 : Solde Projet 4 (45 000 DH - Payée)
        $stmtInv->execute([$proj4_id, $clientIds['sahara_agro'], 45000.00, date('Y-m-d', strtotime('-20 days')), date('Y-m-d', strtotime('-40 days')), 'paid', "Règlement total 100% de la prestation e-commerce"]);
        $inv5_id = (int)$conn->lastInsertId();

        $results['stats']['invoices'] = 5;

        // ==========================================
        // 7. PAIEMENTS (PAYMENTS)
        // Les triggers recalculent automatiquement remaining_amount et total_cost !
        // ==========================================
        $stmtPay = $conn->prepare("INSERT INTO payments (project_id, client_id, invoice_id, amount, payment_date, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");

        // Paiement Projet 1
        $stmtPay->execute([$proj1_id, $clientIds['maroc_logistics'], $inv1_id, 40000.00, date('Y-m-d', strtotime('-5 days')), 'transfer', "Virement Attijariwafa ref #VIR-98214 - Acompte 50%"]);

        // Paiement Projet 2
        $stmtPay->execute([$proj2_id, $clientIds['atlas_fintech'], $inv2_id, 60000.00, date('Y-m-d', strtotime('-10 days')), 'transfer', "Virement BCP ref #BCP-44012 - Phase 1"]);

        // Paiement Projet 4
        $stmtPay->execute([$proj4_id, $clientIds['sahara_agro'], $inv5_id, 45000.00, date('Y-m-d', strtotime('-25 days')), 'transfer', "Règlement solde 100% virement BMCE #BMCE-89102"]);

        $results['stats']['payments'] = 3;

        // ==========================================
        // 8. LOGS D'ACTIVITÉ RÉELS
        // ==========================================
        $stmtLog = $conn->prepare("INSERT INTO activity_logs (user_id, action, entity_type, entity_id, new_value, ip_address) VALUES (?, ?, ?, ?, ?, ?)");
        $stmtLog->execute([1, 'create', 'projects', $proj1_id, json_encode(['name' => 'Portail IoT & Suivi de Flotte B2B', 'total' => 80000]), '127.0.0.1']);
        $stmtLog->execute([1, 'create', 'invoices', $inv1_id, json_encode(['amount' => 40000, 'client' => 'Maroc Digital Logistics']), '127.0.0.1']);
        $stmtLog->execute([1, 'create', 'payments', 1, json_encode(['amount' => 40000, 'method' => 'transfer']), '127.0.0.1']);
        $stmtLog->execute([1, 'create', 'projects', $proj2_id, json_encode(['name' => 'Application Mobile Banking & Wallet', 'total' => 120000]), '127.0.0.1']);
        $stmtLog->execute([1, 'login', 'admin', 1, json_encode(['user' => 'admin']), '127.0.0.1']);
        $results['stats']['activity_logs'] = 5;

        // ==========================================
        // 9. NOTIFICATIONS
        // ==========================================
        $stmtNotif = $conn->prepare("INSERT INTO notifications (user_id, user_role, type, message, is_read) VALUES (?, ?, ?, ?, ?)");
        $stmtNotif->execute([1, 'admin', 'success', "Offre acceptée : Maroc Digital Logistics a validé le projet 'Portail IoT'.", 0]);
        $stmtNotif->execute([1, 'admin', 'success', "Encaissement reçu : 40 000 DH enregistrés pour la facture FAC-2026-001.", 0]);
        $stmtNotif->execute([1, 'admin', 'info', "Nouvelle opportunité : Proposition en attente pour Sahara Agro Export (65 000 DH).", 0]);
        $results['stats']['notifications'] = 3;

        // ==========================================
        // 10. Forcer la mise à jour finale des totaux via SQL
        // ==========================================
        $conn->exec("
            UPDATE projects p SET
                total_cost = (SELECT IFNULL(SUM(price), 0) FROM services WHERE project_id = p.id),
                remaining_amount = (SELECT IFNULL(SUM(price), 0) FROM services WHERE project_id = p.id)
                                 - (SELECT IFNULL(SUM(amount), 0) FROM payments WHERE project_id = p.id)
        ");

    } catch (PDOException $e) {
        $results['success'] = false;
        $results['message'] = "Erreur Factory : " . $e->getMessage();
    }

    return $results;
}

/**
 * Rendu visuel HTML élégant pour navigateur
 */
function renderFactoryHtml(array $res): string
{
    $isSuccess = $res['success'];
    $statusColor = $isSuccess ? '#10B981' : '#EF4444';
    $statusBg = $isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

    ob_start();
    ?>
    <!DOCTYPE html>
    <html lang="fr" dir="ltr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kalyo OS • Factory de Données & Seeder</title>
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
            .badge-status { padding: 8px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; border: 1px solid <?= $statusColor ?>; color: <?= $statusColor ?>; background: <?= $statusBg ?>; }
            .grid-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 14px; margin-bottom: 28px; }
            .stat-card { background: #1E293B; border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; padding: 16px; text-align: center; }
            .stat-value { font-size: 26px; font-weight: 800; color: #38BDF8; margin-bottom: 4px; }
            .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94A3B8; font-weight: 600; }
            .details-box { background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 20px; margin-bottom: 28px; font-size: 13.5px; line-height: 1.6; color: #CBD5E1; }
            .details-box ul { list-style: none; padding: 0; }
            .details-box li { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
            .details-box li:before { content: "✓"; color: #10B981; font-weight: 800; }
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
                        <div class="brand-title">KALYO FACTORY & SEEDER</div>
                        <div class="brand-subtitle">Génération de données réelles d'entreprises marocaines (MAD)</div>
                    </div>
                </div>
                <div class="badge-status">
                    <?= $isSuccess ? '● JEU DE DONNÉES ENRICHIE (OK)' : '● ERREUR DE DÉPLOIEMENT' ?>
                </div>
            </div>

            <?php if (!empty($res['stats'])): ?>
            <div class="grid-stats">
                <div class="stat-card">
                    <div class="stat-value"><?= $res['stats']['clients'] ?? 0 ?></div>
                    <div class="stat-label">Clients B2B</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value"><?= $res['stats']['projects'] ?? 0 ?></div>
                    <div class="stat-label">Projets Réels</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value"><?= $res['stats']['services'] ?? 0 ?></div>
                    <div class="stat-label">Services / Packs</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value"><?= $res['stats']['invoices'] ?? 0 ?></div>
                    <div class="stat-label">Factures Émises</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value"><?= $res['stats']['payments'] ?? 0 ?></div>
                    <div class="stat-label">Encaissements</div>
                </div>
            </div>
            <?php endif; ?>

            <div class="details-box">
                <div style="font-weight: 700; color: #FFF; margin-bottom: 12px; font-size: 14px;">
                    📌 Récapitulatif des comptes et données générés :
                </div>
                <ul>
                    <li><strong>Administrateur Direction :</strong> Compte <code>admin</code> (Mot de passe : <code>admin123</code>)</li>
                    <li><strong>Client 1 :</strong> Maroc Digital Logistics SARL — <code>maroc_logistics</code> (MDP : <code>Client@2026</code>)</li>
                    <li><strong>Client 2 :</strong> Atlas FinTech Solutions SA — <code>atlas_fintech</code> (MDP : <code>Client@2026</code>)</li>
                    <li><strong>Client 3 :</strong> Sahara Agro Export SARL — <code>sahara_agro</code> (MDP : <code>Client@2026</code>)</li>
                    <li><strong>Calculs Triggers MySQL :</strong> Déclencheurs de reste à payer et statuts synchronisés.</li>
                </ul>
            </div>

            <div class="actions-bar">
                <a href="?page=factory" class="btn btn-primary">⚡ Relancer la Factory</a>
                <a href="?page=database" class="btn btn-secondary">🛠️ Réinitialiser Base (Création)</a>
                <a href="http://localhost:5173/login/admin" target="_blank" class="btn btn-success">👑 Ouvrir Admin Kalyo</a>
                <a href="http://localhost:5173/login/client" target="_blank" class="btn btn-secondary">👤 Ouvrir Portail Client</a>
            </div>
        </div>
    </body>
    </html>
    <?php
    return ob_get_clean();
}
