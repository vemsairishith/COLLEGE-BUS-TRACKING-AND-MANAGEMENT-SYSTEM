const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Register
router.post('/register', async (req, res) => {
  try {
    const { userId, name, role, email, password, contact, address } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { userId }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      userId,
      name,
      role,
      email,
      password,
      contact,
      address: address || ''
    });

    await user.save();

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        role: user.role,
        email: user.email,
        contact: user.contact
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        role: user.role,
        email: user.email,
        contact: user.contact,
        address: user.address
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

module.exports = router;

