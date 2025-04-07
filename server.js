// server.js
const app = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.PORT || 3000;

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
    process.exit(1);
  } else {
    console.log('Database connected successfully');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});