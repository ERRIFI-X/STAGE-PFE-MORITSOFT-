# 💻 Kalyo — Frontend Web App (React 19 + Vite + Tailwind CSS v4)

👨‍💻 **Lead Développeur : [Abdelbasste Errifi (@ERRIFI-X)](https://github.com/ERRIFI-X)** 🇲🇦  
🎨 **Développeur Frontend : [Imad Bouafouss (@2IB2)](https://github.com/2IB2)**  
🧪 **QA & Tests : [Omar Ouka (@oukaomar8-max)](https://github.com/oukaomar8-max)**  
[![Lead Dev](https://img.shields.io/badge/Lead_Dev-Abdelbasste_Errifi-10b981?style=flat-square&logo=github&logoColor=white)](https://github.com/ERRIFI-X)
[![Frontend Dev](https://img.shields.io/badge/Frontend_Dev-Imad_Bouafouss_(2IB2)-06b6d4?style=flat-square&logo=github&logoColor=white)](https://github.com/2IB2)
[![QA & Tests](https://img.shields.io/badge/QA_&_Tests-Omar_Ouka-6366f1?style=flat-square&logo=github&logoColor=white)](https://github.com/oukaomar8-max)
[![Licence: MIT](https://img.shields.io/badge/Licence-MIT-yellow.svg?style=flat-square)](LICENSE)

Interface utilisateur moderne, responsive et haute fidélité pour la plateforme **Kalyo**, conçue avec **React 19**, **Vite** et **Tailwind CSS v4**.

---

## 🚀 Fonctionnalités Clés du Frontend

- **Double Portail Utilisateur** :
  - **Espace Direction (`/login/admin`)** : Pilotage complet des projets, simulateur de trésorerie en temps réel (MAD), CRM clients, facturation et génération de documents.
  - **Portail Partenaire Client (`/login/client`)** : Espace épuré et sécurisé pour le suivi des livrables et la consultation des factures.
- **Accès Démo 1-Clic** : Boutons interactifs pré-remplissant automatiquement les identifiants de test pour le jury de soutenance (`admin_tester` / `user_tester`).
- **Simulateur Financier Interactif** : Calcul dynamique du chiffre d'affaires, des encaissements et des créances avec prise en compte de la TVA à 20%.
- **Système de Thème Sombre / Clair** : Basculement dynamique persistant dans le `localStorage`.
- **Modèle de Facture Imprimable** : Mise en page dédiée optimisée pour l'impression papier et l'export PDF.
- **Sécurisation par Routes Protégées** : Gardes `ProtectedRoute` et redirection automatique selon le rôle de l'utilisateur (Admin vs Client).

---

## 🛠️ Stack Technique

- **Framework** : [React 19](https://react.dev/)
- **Outil de Build** : [Vite 6](https://vitejs.dev/)
- **Styles & Design System** : [Tailwind CSS v4](https://tailwindcss.com/)
- **Routage** : [React Router DOM 7](https://reactrouter.com/)
- **Gestion des Requêtes HTTP** : [Axios](https://axios-http.com/) avec intercepteur d'injection automatique du token JWT
- **Icônes** : [Lucide React](https://lucide.dev/)
- **Notifications** : [React Hot Toast](https://react-hot-toast.com/)

---

## ⚙️ Installation & Démarrage

### 1. Cloner et installer les dépendances
```bash
cd frontend
npm install
```

### 2. Configuration des Variables d'Environnement
Créez un fichier `.env` basé sur `.env.example` :
```env
VITE_API_URL=http://localhost:8000
```
> Si vous utilisez Apache/XAMPP, adaptez l'URL, par exemple : `http://localhost/backend_gestionPro`

### 3. Lancer le serveur de développement
```bash
npm run dev
```
L'application démarre sur : **`http://localhost:5173`**

### 4. Build de Production
```bash
npm run build
npm run preview
```

---

## 📁 Architecture du Code Source (`src/`)

```text
src/
├── api/
│   └── api.jsx                 # Client Axios avec intercepteur JWT et méthodes d'API
├── components/
│   ├── auth/                   # Composants de protection de routes et ErrorBoundary
│   ├── elements/               # Modals, formulaires de factures, paiements, wizard de projet
│   └── layout/                 # Layouts, Header, Sidebar, BrandLogo
├── context/
│   └── AuthContext.jsx         # Gestionnaire d'authentification (tokens, rôles, déconnexion)
├── pages/
│   ├── AdminLogin.jsx          # Connexion Espace Direction (avec bouton Démo 1-clic)
│   ├── ClientLogin.jsx         # Connexion Portail Client (avec bouton Démo 1-clic)
│   ├── Dashboard.jsx           # Tableau de bord Direction & simulateur de trésorerie
│   ├── Project.jsx             # Gestion et suivi des projets
│   ├── Clients.jsx             # Annuaire et gestion CRM des clients
│   ├── Invoices.jsx            # Gestion de la facturation
│   ├── InvoicePrint.jsx        # Vue d'impression facture formatée
│   ├── Payments.jsx            # Gestion des règlements
│   └── user/                   # Espace Partenaire Client
│       ├── UserDashboard.jsx   # Tableau de bord client
│       ├── UserProjects.jsx    # Projets du client
│       └── UserInvoices.jsx    # Factures du client
├── Router/
│   └── Routerapp.jsx           # Définition des routes et permissions
├── index.css                   # Styles globaux & directives Tailwind v4
└── main.jsx                    # Point d'entrée React
```

---

## 🧪 Identifiants Démo pour Soutenance

| Rôle | URL | Identifiant | Mot de passe |
| :--- | :--- | :--- | :--- |
| **Admin Testeur** | `/login/admin` | `admin_tester` | `tester123` |
| **Client Testeur** | `/login/client` | `user_tester` | `tester123` |
