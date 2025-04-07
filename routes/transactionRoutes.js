// routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const auth = require('../middleware/auth');

router.get('/', auth, transactionController.getAllTransactions);
router.get('/:id', auth, transactionController.getTransactionById);
router.get('/user/:userId', auth, transactionController.getUserTransactions);

module.exports = router;