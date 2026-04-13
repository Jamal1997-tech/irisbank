const express = require('express');
const { getAllUsers, updateUser, deleteUser, getAllAccounts, blockAccount, unblockAccount, getStats } = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const router = express.Router();

router.get('/users', authMiddleware, adminMiddleware, getAllUsers);
router.put('/users/:id', authMiddleware, adminMiddleware, updateUser);
router.delete('/users/:id', authMiddleware, adminMiddleware, deleteUser);
router.get('/accounts', authMiddleware, adminMiddleware, getAllAccounts);
router.put('/accounts/:id/block', authMiddleware, adminMiddleware, blockAccount);
router.put('/accounts/:id/unblock', authMiddleware, adminMiddleware, unblockAccount);
router.get('/stats', authMiddleware, adminMiddleware, getStats);

module.exports = router;