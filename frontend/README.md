# IRIS Bank Frontend

Frontend pour l'application bancaire IRIS Bank, utilisant HTML, CSS (Bootstrap + Tailwind), JavaScript et Font Awesome.

## Fonctionnalités

- Page d'accueil avec connexion/inscription
- Dashboard utilisateur : comptes, transactions, profil
- Panel administrateur : gestion clients/comptes, statistiques
- Interface responsive et moderne

## Technologies

- **Bootstrap** : Framework CSS pour le layout
- **Tailwind CSS** : Utilitaires CSS supplémentaires
- **Font Awesome** : Icônes
- **Vanilla JavaScript** : Logique frontend et appels API

## Installation et lancement

1. Aller dans le dossier frontend : `cd frontend`
2. Installer les dépendances : `npm install`
3. Lancer le serveur : `npm start`
4. Ouvrir http://localhost:3001 dans votre navigateur

## Structure

- `public/index.html` : Page de connexion/inscription
- `public/dashboard.html` : Dashboard utilisateur
- `public/admin.html` : Panel admin
- `public/js/` : Scripts JavaScript
- `server.js` : Serveur Express pour servir les fichiers statiques

## Utilisation

1. **Inscription** : Créer un compte utilisateur
2. **Connexion** : Se connecter avec email/mot de passe
3. **Dashboard** : Gérer comptes et effectuer transactions
4. **Admin** : Si rôle admin, accès au panel de gestion

Assurez-vous que le backend est lancé sur http://localhost:3000 avant d'utiliser le frontend.