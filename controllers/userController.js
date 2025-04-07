// controllers/userController.js
const db = require('../config/db');
const { addBankAccount } = require('../utils/stripeUtils');

/**
 * Get user details
 */
exports.getUserDetails = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Ensure the user is accessing their own profile
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const result = await db.query(
      'SELECT id, email, first_name, last_name, stripe_account_id, bank_account_id, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Get user details error:', error);
    next(error);
  }
};

/**
 * Add bank account to a user
 */
exports.addBankAccount = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    // Ensure the user is adding to their own account
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { account_holder_name, routing_number, account_number } = req.body;

    // Get user's Stripe account ID
    const userResult = await db.query(
      'SELECT stripe_account_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const stripeAccountId = userResult.rows[0].stripe_account_id;

    // Add bank account to Stripe
    const bankAccountId = await addBankAccount(stripeAccountId, {
      account_holder_name,
      routing_number,
      account_number,
    });

    // Update user in database
    await db.query(
      'UPDATE users SET bank_account_id = $1, updated_at = NOW() WHERE id = $2',
      [bankAccountId, userId]
    );

    res.json({
      message: 'Bank account added successfully',
      bank_account_id: bankAccountId,
    });
  } catch (error) {
    console.error('Add bank account error:', error);
    next(error);
  }
};

/**
 * Get user payout history
 */
exports.getPayoutHistory = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    // Ensure the user is accessing their own data
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const result = await db.query(
      `SELECT p.*, t.stripe_transaction_id, t.status as transaction_status, t.amount 
       FROM payouts p
       JOIN transactions t ON p.transaction_id = t.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json({
      payouts: result.rows,
    });
  } catch (error) {
    console.error('Get payout history error:', error);
    next(error);
  }
};