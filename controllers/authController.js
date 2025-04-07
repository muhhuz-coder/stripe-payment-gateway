// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { createStripeAccount } = require('../utils/stripeUtils');

/**
 * Register a new user and create their Stripe account
 */
exports.register = async (req, res, next) => {
  const { email, password, first_name, last_name } = req.body;

  try {
    // Check if user already exists
    const userExists = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Stripe account
    const stripeAccountId = await createStripeAccount({
      email,
      first_name,
      last_name,
    });

    // Create user in database
    const result = await db.query(
      'INSERT INTO users (email, password, first_name, last_name, stripe_account_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, stripe_account_id',
      [email, hashedPassword, first_name, last_name, stripeAccountId]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
};

/**
 * Login a user
 */
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const result = await db.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};