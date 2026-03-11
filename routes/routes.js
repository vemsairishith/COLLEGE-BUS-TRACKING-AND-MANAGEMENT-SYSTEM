const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Allocation = require('../models/Allocation');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

// Get all routes (All authenticated users)
router.get('/', authenticate, async (req, res) => {
  try {
    const routes = await Route.find()
      .populate('busId', 'busNumber capacity status currentStop')
      .populate('driverId', 'name contact email');
    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching routes', error: error.message });
  }
});

// Add route (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { routeId, routeName, stops, timings, busId, driverId } = req.body;

    const route = new Route({
      routeId,
      routeName,
      stops,
      timings,
      busId: busId || null,
      driverId: driverId || null
    });

    await route.save();
    const populatedRoute = await Route.findById(route._id)
      .populate('busId', 'busNumber capacity status')
      .populate('driverId', 'name contact email');
    
    res.status(201).json({ message: 'Route added successfully', route: populatedRoute });
  } catch (error) {
    res.status(500).json({ message: 'Error adding route', error: error.message });
  }
});

// Assign student to route (Admin only)
router.post('/assign', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { allocationId, studentId, routeId, assignedStop } = req.body;

    const allocation = new Allocation({
      allocationId,
      studentId,
      routeId,
      assignedStop
    });

    await allocation.save();
    const populatedAllocation = await Allocation.findById(allocation._id)
      .populate('studentId', 'name email contact')
      .populate('routeId', 'routeName stops');

    res.status(201).json({ message: 'Student assigned to route', allocation: populatedAllocation });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning student', error: error.message });
  }
});

// Get student's route (Student only)
router.get('/student/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Check if user is the student or admin
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (req.user.role !== 'admin' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const allocation = await Allocation.findOne({ studentId })
      .populate('routeId')
      .populate('studentId', 'name email contact');

    if (!allocation) {
      return res.status(404).json({ message: 'No route assigned to this student' });
    }

    const route = await Route.findById(allocation.routeId._id)
      .populate('busId', 'busNumber capacity status currentStop')
      .populate('driverId', 'name contact email');

    // Calculate ETA
    const stops = route.stops;
    const currentStopIndex = stops.indexOf(route.busId?.currentStop || '');
    const assignedStopIndex = stops.indexOf(allocation.assignedStop);
    const stopsAway = assignedStopIndex - currentStopIndex;
    
    let statusMessage = '';
    if (stopsAway < 0) {
      statusMessage = 'Bus has passed your stop';
    } else if (stopsAway === 0) {
      statusMessage = 'Bus is at your stop';
    } else if (stopsAway === 1) {
      statusMessage = 'Bus is 1 stop away';
    } else {
      statusMessage = `Bus is ${stopsAway} stops away`;
    }

    res.json({
      route,
      allocation,
      statusMessage,
      stopsAway: stopsAway >= 0 ? stopsAway : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student route', error: error.message });
  }
});

module.exports = router;

