const dotenv = require('dotenv');
const { pool } = require('../config/db');

// Ensure environment variables are loaded
dotenv.config();

const createTables = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        stripe_account_id VARCHAR(255),
        bank_account_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Rest of your table creation code...
    
    console.log('All tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
};

createTables();