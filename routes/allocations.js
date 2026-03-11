const express = require('express');
const router = express.Router();
const Allocation = require('../models/Allocation');
const { authenticate, authorize } = require('../middleware/auth');

// Get all allocations (Admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const allocations = await Allocation.find()
      .populate('studentId', 'name email contact address')
      .populate('routeId', 'routeName stops');
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching allocations', error: error.message });
  }
});

module.exports = router;

