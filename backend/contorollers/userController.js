const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Register User
exports.register = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters with uppercase, lowercase, number and special character'
      });
    }

    const connection = await pool.getConnection();

    // Check if user exists
    const [existingUser] = await connection.query('SELECT * FROM User WHERE Username = ?', [username]);
    if (existingUser.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await connection.query('INSERT INTO User (Username, Password, Email) VALUES (?, ?, ?)', 
      [username, hashedPassword, email]);

    connection.release();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const connection = await pool.getConnection();

    const [users] = await connection.query('SELECT * FROM User WHERE Username = ?', [username]);
    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.Password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user.UserID }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(200).json({ message: 'Login successful', token, userId: user.UserID });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};