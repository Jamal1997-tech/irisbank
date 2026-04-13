# IRIS Bank Backend

Backend API pour l'application bancaire IRIS Bank, développée avec Node.js, Express et MySQL.

## Fonctionnalités

- Authentification (inscription/connexion) avec JWT
- Gestion des utilisateurs (CRUD)
- Gestion des comptes bancaires
- Transactions (dépôt, retrait, virement)
- Panel administrateur

## Installation

1. Cloner le repository
2. Installer les dépendances : `npm install`
3. Configurer la base de données MySQL et mettre à jour le fichier `.env`
4. Créer les tables avec Sequelize : `npx sequelize-cli db:migrate` (si migrations configurées)
5. Lancer le serveur : `npm start` ou `npm run dev`

## Structure du projet

- `controllers/` : Logique métier
- `models/` : Modèles Sequelize
- `routes/` : Définition des routes
- `middlewares/` : Middlewares (auth, admin)
- `config/` : Configuration DB
- `services/` : Services utilitaires

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login

### Utilisateur
- GET /api/users/profile
- PUT /api/users/profile
- PUT /api/users/change-password

### Comptes
- POST /api/accounts
- GET /api/accounts
- GET /api/accounts/:id
- DELETE /api/accounts/:id

### Transactions
- POST /api/transactions/deposit
- POST /api/transactions/withdraw
- POST /api/transactions/transfer
- POST /api/transactions/transfer-iban
- GET /api/transactions/history/:compte_id

### Admin
- GET /api/admin/users
- PUT /api/admin/users/:id
- DELETE /api/admin/users/:id
- GET /api/admin/accounts
- PUT /api/admin/accounts/:id/block
- PUT /api/admin/accounts/:id/unblock
- GET /api/admin/stats