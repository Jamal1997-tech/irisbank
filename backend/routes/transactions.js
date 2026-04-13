const express = require('express');
const { deposit, withdraw, transfer, transferByIBAN, getTransactionHistory, getAllUserTransactions } = require('../controllers/transactionController');
const { authMiddleware } = require('../middlewares/auth');
const router = express.Router();

router.post('/deposit', authMiddleware, deposit);
router.post('/withdraw', authMiddleware, withdraw);
router.post('/transfer', authMiddleware, transfer);
router.post('/transfer-iban', authMiddleware, transferByIBAN);
router.get('/history/:compte_id', authMiddleware, getTransactionHistory);
router.get('/history', authMiddleware, getAllUserTransactions);

module.exports = router;