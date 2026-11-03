import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const router = express.Router();

// SIGNUP
router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ 
      error: { code: 'VALIDATION_ERROR', message: 'All fields are required.' } 
    });
  }
  if (password.length < 6) {
    return res.status(400).json({ 
      error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 6 characters.' } 
    });
  }

  try {
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, existingUser) => {
      if (err) return res.status(500).json({ error: { message: 'Database error.' } });
      if (existingUser) {
        return res.status(409).json({ 
          error: { code: 'CONFLICT', message: 'Email already exists.' } 
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const sql = `INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)`;
      
      db.run(sql, [firstName, lastName, email, hashedPassword], function(err) {
        if (err) return res.status(500).json({ error: { message: 'Failed to create user.' } });

        const userId = this.lastID;
        const token = jwt.sign(
          { id: userId, email },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        res.status(201).json({
          message: 'User created successfully',
          token,
          user: { id: userId, firstName, lastName, email }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

// LOGIN Routes to handle user login and generate JWT token for authentication.
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      error: { code: 'VALIDATION_ERROR', message: 'Email and password are required.' } 
    });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: { message: 'Database error.' } });
    if (!user) {
      return res.status(401).json({ 
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } 
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } 
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email }
    });
  });
});

// LOGOUT
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully. Please clear token on client side.' });
});

export default router;