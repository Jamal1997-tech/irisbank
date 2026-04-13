const express = require('express');
const { register, login } = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');
const securityMiddleware = require('../middlewares/security');
const router = express.Router();

router.post('/register', register);
router.post('/login', securityMiddleware.loginRateLimit, login);

// Endpoint pour récupérer un token CSRF
router.get('/csrf-token', authMiddleware, (req, res) => {
  res.json({
    csrfToken: req.csrfToken,
    success: true
  });
});

module.exports = router;