const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');
const securityMiddleware = require('./middlewares/security');

// Charger les variables d'environnement
dotenv.config();

const app = express();

// Connexion à la base de données
connectDB();

// Créer un utilisateur admin par défaut pour les tests
const createDefaultAdmin = async () => {
  try {
    console.log('Création d\'un utilisateur admin par défaut...');
    // Pour l'instant, on ne crée pas d'admin automatiquement
    // Cela sera fait quand la base de données sera fonctionnelle
  } catch (error) {
    console.error('Erreur lors de la création de l\'admin:', error);
  }
};

createDefaultAdmin();

// Synchronisation de la base de données
require('./sync');

// Middlewares de sécurité (avant les autres middlewares)
app.use(securityMiddleware.limiter);
// app.use('/api/auth', securityMiddleware.authLimiter); // Commenté car on utilise loginRateLimit spécifique
app.use(securityMiddleware.securityHeaders);
app.use(securityMiddleware.sanitizeInput);
app.use(securityMiddleware.csrfProtection);
app.use(securityMiddleware.requestLogger);

// Middlewares globaux
const allowedOrigins = [
  'http://localhost:3000', 'http://localhost:3001',
  'http://127.0.0.1:3000', 'http://127.0.0.1:3001'
];
if (process.env.RENDER_EXTERNAL_URL) allowedOrigins.push(process.env.RENDER_EXTERNAL_URL);
if (process.env.PUBLIC_URL) allowedOrigins.push(process.env.PUBLIC_URL);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'Accept',
    'Accept-Encoding',
    'Accept-Language',
    'Cache-Control',
    'Connection',
    'Host',
    'Origin',
    'Referer',
    'Sec-Fetch-Dest',
    'Sec-Fetch-Mode',
    'Sec-Fetch-Site',
    'User-Agent',
    'X-Forwarded-For',
    'X-Real-IP',
    'X-Requested-With',
    'DNT',
    'Upgrade-Insecure-Requests'
  ],
  exposedHeaders: [
    'X-CSRF-Token',
    'Content-Length',
    'Content-Type',
    'Authorization'
  ],
  maxAge: 86400 // 24 hours
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin');
const supportRoutes = require('./routes/support');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);

// Route de base de l'API (utile pour vérifier que le backend répond)
app.get('/api', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API IRIS Bank' });
});

// Sert le frontend statique (build unique : un seul service, une seule URL publique)
const frontendPath = path.join(__dirname, '..', 'frontend', 'public');
app.use(express.static(frontendPath));

// Gestion des erreurs sécurisée
app.use(securityMiddleware.errorLogger);

// Routes API non trouvées -> JSON, le reste -> page d'erreur front
app.use('*', (req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ message: 'Route non trouvée' });
  }
  res.status(404).sendFile(path.join(frontendPath, 'error.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;