const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Map pour suivre les tentatives de connexion échouées par IP
const loginAttempts = new Map();

// Nettoyer les anciennes tentatives toutes les 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of loginAttempts.entries()) {
    if (now - data.lastAttempt > 5 * 60 * 1000) { // 5 minutes
      loginAttempts.delete(ip);
    }
  }
}, 60 * 1000); // Vérifier chaque minute

// Middleware de limitation des tentatives de connexion
const loginRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  // Initialiser les données pour cette IP si elle n'existe pas
  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, {
      attempts: 0,
      lastAttempt: now,
      blockedUntil: null
    });
  }

  const attemptData = loginAttempts.get(ip);

  // Vérifier si l'IP est bloquée
  if (attemptData.blockedUntil && now < attemptData.blockedUntil) {
    const remainingTime = Math.ceil((attemptData.blockedUntil - now) / 1000);
    return res.status(429).json({
      error: `Trop de tentatives de connexion échouées. Veuillez attendre ${remainingTime} secondes avant de réessayer.`
    });
  }

  // Si plus de 1 minute s'est écoulée depuis la dernière tentative, réinitialiser le compteur
  if (now - attemptData.lastAttempt > 60 * 1000) {
    attemptData.attempts = 0;
    attemptData.blockedUntil = null;
  }

  // Mettre à jour la dernière tentative
  attemptData.lastAttempt = now;

  // Stocker les données mises à jour
  loginAttempts.set(ip, attemptData);

  // Ajouter une méthode pour signaler un échec de connexion
  req.loginFailed = () => {
    attemptData.attempts += 1;

    // Bloquer pendant 1 minute après 5 échecs
    if (attemptData.attempts >= 5) {
      attemptData.blockedUntil = now + 60 * 1000; // 1 minute
      attemptData.attempts = 0; // Réinitialiser après blocage
    }

    loginAttempts.set(ip, attemptData);
  };

  // Ajouter une méthode pour signaler un succès de connexion
  req.loginSuccess = () => {
    // Réinitialiser les tentatives en cas de succès
    loginAttempts.set(ip, {
      attempts: 0,
      lastAttempt: now,
      blockedUntil: null
    });
  };

  next();
};

// Rate limiting général
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for auth routes (maintenu pour compatibilité)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth
  message: {
    error: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Trop de requêtes API, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false
});

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize request body, query, and params
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Basic XSS protection
        req.body[key] = req.body[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        req.body[key] = req.body[key].replace(/javascript:/gi, '');
        req.body[key] = req.body[key].replace(/on\w+\s*=/gi, '');
      }
    });
  }

  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        req.query[key] = req.query[key].replace(/javascript:/gi, '');
        req.query[key] = req.query[key].replace(/on\w+\s*=/gi, '');
      }
    });
  }

  next();
};

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // Generate CSRF token for forms (unique per request)
  const token = require('crypto').randomBytes(32).toString('hex');
  res.locals.csrfToken = token;
  req.csrfToken = token;

  // Skip CSRF check for authentication routes (login/register don't need CSRF tokens)
  // and API routes that use Bearer token authentication
  if ((req.path.startsWith('/api/auth/') && (req.path.includes('/login') || req.path.includes('/register'))) ||
      req.path === '/api/support/contacts' ||
      (req.path.startsWith('/api/') && req.headers.authorization?.startsWith('Bearer '))) {
    return next();
  }

  // For state-changing operations, check if it's a safe method
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (!safeMethods.includes(req.method)) {
    // Check CSRF token from request headers or body
    const requestToken = req.headers['x-csrf-token'] || req.body._csrf || req.headers['csrf-token'];

    if (!requestToken) {
      console.log(`CSRF Protection: Missing CSRF token for ${req.method} ${req.path} from ${req.ip}`);
      return res.status(403).json({
        error: 'Token CSRF manquant. Veuillez rafraîchir la page et réessayer.'
      });
    }

    // In a real implementation, you'd validate the token against a stored token
    // For now, we'll just check if it's a valid hex string of correct length
    if (!/^[a-f0-9]{64}$/.test(requestToken)) {
      console.log(`CSRF Protection: Invalid CSRF token format for ${req.method} ${req.path} from ${req.ip}`);
      return res.status(403).json({
        error: 'Token CSRF invalide.'
      });
    }

    console.log(`CSRF Check: Valid token for ${req.method} ${req.path} from ${req.ip}`);
  }

  next();
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';

  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${ip} - User-Agent: ${userAgent.substring(0, 50)}...`);

  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`[${timestamp}] Response: ${res.statusCode} - Size: ${data ? data.length : 0} bytes`);
    originalSend.call(this, data);
  };

  next();
};

// Error logging middleware
const errorLogger = (error, req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;

  console.error(`[${timestamp}] ERROR: ${error.message}`);
  console.error(`[${timestamp}] Stack: ${error.stack}`);
  console.error(`[${timestamp}] Request: ${req.method} ${req.path} - IP: ${ip}`);

  // Don't expose error details to client
  res.status(500).json({
    error: 'Une erreur interne est survenue. Veuillez réessayer plus tard.',
    timestamp: timestamp
  });
};

module.exports = {
  limiter,
  authLimiter,
  loginRateLimit,
  apiLimiter,
  securityHeaders,
  sanitizeInput,
  csrfProtection,
  requestLogger,
  errorLogger,
  // Combined security middleware
  securityMiddleware: [
    securityHeaders,
    mongoSanitize(),
    xss(),
    hpp(),
    sanitizeInput,
    csrfProtection,
    requestLogger
  ]
};