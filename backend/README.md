# ⚙️ Kalyo — Backend API REST (PHP 8.2+)

👨‍💻 **Lead Développeur : [Abdelbasste Errifi (@ERRIFI-X)](https://github.com/ERRIFI-X)** 🇲🇦  
🎨 **Développeur Frontend : [Imad Bouafouss (@2IB2)](https://github.com/2IB2)**  
🧪 **QA & Tests : [Omar Ouka (@oukaomar8-max)](https://github.com/oukaomar8-max)**  
[![Lead Dev](https://img.shields.io/badge/Lead_Dev-Abdelbasste_Errifi-10b981?style=flat-square&logo=github&logoColor=white)](https://github.com/ERRIFI-X)
[![Frontend Dev](https://img.shields.io/badge/Frontend_Dev-Imad_Bouafouss_(2IB2)-06b6d4?style=flat-square&logo=github&logoColor=white)](https://github.com/2IB2)
[![QA & Tests](https://img.shields.io/badge/QA_&_Tests-Omar_Ouka-6366f1?style=flat-square&logo=github&logoColor=white)](https://github.com/oukaomar8-max)
[![Licence: MIT](https://img.shields.io/badge/Licence-MIT-yellow.svg?style=flat-square)](LICENSE)

Architecture serveur et API RESTful de la plateforme **Kalyo**, conçue pour la gestion de projets, la facturation en Dirhams (MAD) et la gestion de trésorerie d'entreprise.

---

## 🚀 Fonctionnalités du Backend

- **Authentification double portail** :
  - Espace Direction & Administration (`/api/login`)
  - Espace Partenaire Client (`/api/client/login`)
- **Sécurité JWT** : Tokens stateless générés avec `firebase/php-jwt`.
- **Triggers MySQL Automatiques** :
  - Recalcul en temps réel du coût total du projet lors de l'ajout/modification/suppression de services.
  - Recalcul du reste à payer (`remaining_amount`) en fonction des règlements effectués.
  - Calcul dynamique de la date de livraison prévisionnelle en sommant la durée des services.
- **Facturation marocaine** : Calcul des montants HT, TVA légale à 20%, TTC et suivi des acomptes.
- **Protection par requêtes préparées PDO** : Prévention totale contre les injections SQL.
- **CORS Configuré** : Autorisation contrôlée des requêtes cross-origin avec gestion des requêtes préliminaires (OPTIONS).

---

## 🛠️ Stack & Prérequis

- **PHP 8.2+** avec extensions `pdo_mysql`, `openssl`, `mbstring`.
- **Composer** (pour les dépendances PHP).
- **MySQL 8.0+** ou **MariaDB 10.4+**.

---

## 📦 Installation & Démarrage

### 1. Installation des dépendances
```bash
composer install
```

### 2. Configuration de la base de données
1. Créez la base de données MySQL :
   ```sql
   CREATE DATABASE gestion_de_project CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Importez le fichier [`database.sql`](database.sql) :
   ```bash
   mysql -u root -p gestion_de_project < database.sql
   ```
3. Ajustez les paramètres de connexion dans [`routes/config.php`](routes/config.php) ou via `.env` :
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   define('DB_NAME', 'gestion_de_project');
   define('JWT_SECRET', 'cle_secrete_jwt_kalyo');
   ```

### 3. Démarrage du serveur PHP intégré
```bash
php -S localhost:8000
```
L'API sera opérationnelle sur `http://localhost:8000`.

---

## 📡 Endpoints de l'API

### Authentification & Session
- `POST /api/login` : Authentification Admin
- `POST /api/client/login` : Authentification Client
- `POST /api/register` : Création d'administrateur

### Projets & WBS
- `GET /api/projects` : Liste des projets
- `POST /api/projects` : Créer un projet
- `GET /api/projects/{id}` : Détails d'un projet et ses tâches
- `PUT /api/projects/{id}` : Mettre à jour un projet
- `DELETE /api/projects/{id}` : Supprimer un projet
- `GET /api/client/projects` : Projets rattachés au client authentifié

### Clients
- `GET /api/clients` : Liste de tous les clients
- `POST /api/clients` : Ajouter un client
- `PUT /api/clients/{id}` : Modifier un client
- `DELETE /api/clients/{id}` : Supprimer un client

### Facturation & Règlements (MAD)
- `GET /api/invoices` : Liste des factures
- `POST /api/invoices` : Émettre une facture (calcul HT, TVA 20%, TTC)
- `GET /api/invoices/{id}` : Détails d'une facture pour impression
- `POST /api/payments` : Enregistrer un règlement
- `GET /api/payments` : Historique des paiements
- `GET /api/client/invoices` : Factures du client connecté

### Dashboard & Statistiques
- `GET /api/dashboard/stats` : KPI financiers et d'activité
- `GET /api/client/dashboard` : Synthèse pour le portail client
- `GET /api/notifications` : Journal d'activité et alertes

---

## 🔒 Sécurité & Bonnes Pratiques

- Mots de passe chiffrés via `password_hash()` avec `PASSWORD_BCRYPT`.
- En-tête obligatoire pour les requêtes authentifiées : `Authorization: Bearer <token>`.
- Vérification stricte des permissions et des identifiants d'entreprise pour les comptes clients.
