// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/:id', auth, userController.getUserDetails);
router.post('/:id/bank-account', auth, userController.addBankAccount);
router.get('/:id/payouts', auth, userController.getPayoutHistory);

module.exports = router;