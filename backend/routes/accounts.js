const express = require('express');
const { createAccount, getAccounts, getAccountDetails, deleteAccount } = require('../controllers/accountController');
const { authMiddleware } = require('../middlewares/auth');
const router = express.Router();

router.post('/', authMiddleware, createAccount);
router.get('/', authMiddleware, getAccounts);
router.get('/:id', authMiddleware, getAccountDetails);
router.delete('/:id', authMiddleware, deleteAccount);

module.exports = router;