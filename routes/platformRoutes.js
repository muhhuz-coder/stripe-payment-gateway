// routes/platformRoutes.js
const express = require('express');
const router = express.Router();
const platformController = require('../controllers/platformController');
const auth = require('../middleware/auth');

router.get('/balance', auth, platformController.getBalance);
router.post('/recharge', auth, platformController.rechargeAccount);
router.post('/payout', auth, platformController.processPayout);

module.exports = router;
