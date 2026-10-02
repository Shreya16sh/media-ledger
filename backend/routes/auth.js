const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/db');

// POST /api/auth/login
// Body: { username, password }
// Checks the Users table and, if it matches, hands back a simple token.
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT UserId, Username, FullName, Password FROM Users WHERE Username = @username');

    const user = result.recordset[0];

    if (!user || user.Password !== password) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Not real security - just enough to demonstrate a protected app.
    const token = `medialedger-${user.Username}-${Date.now()}`;

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.UserId, username: user.Username, fullName: user.FullName }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

module.exports = router;
