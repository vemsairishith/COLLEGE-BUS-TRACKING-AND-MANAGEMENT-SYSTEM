const express = require('express');
const router = express.Router();
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Allocation = require('../models/Allocation');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

// Get summary stats (Admin only)
router.get('/summary', authenticate, authorize('admin'), async (req, res) => {
  try {
    const totalBuses = await Bus.countDocuments();
    const activeRoutes = await Route.countDocuments();
    const studentsAllocated = await Allocation.countDocuments();
    const busesEnRoute = await Bus.countDocuments({ status: { $in: ['Running', 'En Route'] } });

    res.json({
      totalBuses,
      activeRoutes,
      studentsAllocated,
      busesEnRoute
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching summary', error: error.message });
  }
});

// Get all users by role
router.get('/users/:role', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.params;
    const users = await User.find({ role }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

module.exports = router;

