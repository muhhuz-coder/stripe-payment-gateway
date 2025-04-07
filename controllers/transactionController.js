// controllers/transactionController.js
const db = require('../config/db');

/**
 * Get all transactions (admin only in a real app)
 */
exports.getAllTransactions = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT t.*, u.email as user_email 
       FROM transactions t
       LEFT JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC`
    );
    
    res.json({
      transactions: result.rows,
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    next(error);
  }
};

/**
 * Get transaction by ID
 */
exports.getTransactionById = async (req, res, next) => {
  try {
    const transactionId = req.params.id;
    
    const result = await db.query(
      `SELECT t.*, u.email as user_email 
       FROM transactions t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [transactionId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // If it's a payout, get payout details too
    let payoutDetails = null;
    if (result.rows[0].type === 'payout') {
      const payoutResult = await db.query(
        'SELECT * FROM payouts WHERE transaction_id = $1',
        [transactionId]
      );
      
      if (payoutResult.rows.length > 0) {
        payoutDetails = payoutResult.rows[0];
      }
    }
    
    res.json({
      transaction: result.rows[0],
      payout: payoutDetails,
    });
  } catch (error) {
    console.error('Get transaction by ID error:', error);
    next(error);
  }
};

/**
 * Get user transactions
 */
exports.getUserTransactions = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    
    // Ensure the user is accessing their own transactions
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const result = await db.query(
      `SELECT * FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    
    res.json({
      transactions: result.rows,
    });
  } catch (error) {
    console.error('Get user transactions error:', error);
    next(error);
  }
};