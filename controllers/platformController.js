// controllers/platformController.js
const db = require('../config/db');
const {
  createPaymentIntent,
  getPlatformBalance,
  transferToUserAccount,
  createPayout,
} = require('../utils/stripeUtils');

/**
 * Get platform balance
 */
exports.getBalance = async (req, res, next) => {
  try {
    const balance = await getPlatformBalance();
    
    res.json({
      available: balance.available.reduce((sum, item) => sum + item.amount, 0) / 100, // Convert cents to dollars
      pending: balance.pending.reduce((sum, item) => sum + item.amount, 0) / 100,
      currency: 'usd',
    });
  } catch (error) {
    console.error('Get platform balance error:', error);
    next(error);
  }
};

/**
 * Recharge platform account
 */
exports.rechargeAccount = async (req, res, next) => {
  try {
    const { amount, payment_method_id } = req.body;
    
    // Amount should be in cents for Stripe
    const amountInCents = Math.round(amount * 100);
    
    // Create payment intent
    const paymentIntent = await createPaymentIntent(amountInCents);
    
    // In a real app, you would confirm the payment intent with the payment method
    // For demonstration, we'll assume it's confirmed and successful
    
    // Record transaction in database
    const result = await db.query(
      'INSERT INTO transactions (type, amount, status, stripe_transaction_id, description) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['recharge', amount, 'succeeded', paymentIntent.id, 'Platform account recharge']
    );
    
    res.json({
      message: 'Platform account recharged successfully',
      transaction_id: result.rows[0].id,
      amount,
      payment_intent: paymentIntent,
    });
  } catch (error) {
    console.error('Recharge account error:', error);
    next(error);
  }
};

/**
 * Process payout to a user
 */
exports.processPayout = async (req, res, next) => {
  try {
    const { user_id, amount, description } = req.body;
    
    // Amount should be in cents for Stripe
    const amountInCents = Math.round(amount * 100);
    
    // Get user's Stripe account ID
    const userResult = await db.query(
      'SELECT stripe_account_id, bank_account_id FROM users WHERE id = $1',
      [user_id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    if (!user.stripe_account_id) {
      return res.status(400).json({ message: 'User does not have a Stripe account' });
    }
    
    if (!user.bank_account_id) {
      return res.status(400).json({ message: 'User does not have a bank account' });
    }
    
    // Transfer funds from platform to user's Stripe account
    const transfer = await transferToUserAccount(user.stripe_account_id, amountInCents);
    
    // Create payout from user's Stripe account to their bank account
    const payout = await createPayout(user.stripe_account_id, amountInCents);
    
    // Record transaction in database
    const transactionResult = await db.query(
      'INSERT INTO transactions (type, amount, status, stripe_transaction_id, user_id, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      ['payout', amount, 'succeeded', transfer.id, user_id, description || 'Payout to user']
    );
    
    const transactionId = transactionResult.rows[0].id;
    
    // Record payout in database
    await db.query(
      'INSERT INTO payouts (transaction_id, user_id, amount, stripe_transfer_id, stripe_payout_id, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [transactionId, user_id, amount, transfer.id, payout.id, 'succeeded']
    );
    
    res.json({
      message: 'Payout processed successfully',
      transaction_id: transactionId,
      amount,
      transfer_id: transfer.id,
      payout_id: payout.id,
    });
  } catch (error) {
    console.error('Process payout error:', error);
    next(error);
  }
};