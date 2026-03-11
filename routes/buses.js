const express = require('express');
const router = express.Router();
const Bus = require('../models/Bus');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

// Get all buses (Admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const buses = await Bus.find().populate('driverId', 'name contact email');
    res.json(buses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching buses', error: error.message });
  }
});

// Add bus (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { busId, busNumber, capacity, driverId } = req.body;

    const bus = new Bus({
      busId,
      busNumber,
      capacity,
      driverId: driverId || null
    });

    await bus.save();
    const populatedBus = await Bus.findById(bus._id).populate('driverId', 'name contact email');
    
    res.status(201).json({ message: 'Bus added successfully', bus: populatedBus });
  } catch (error) {
    res.status(500).json({ message: 'Error adding bus', error: error.message });
  }
});

// Update bus location/status (Driver/Admin)
router.put('/:id/location', authenticate, async (req, res) => {
  try {
    const { currentStop, status } = req.body;
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    // Check if user is driver of this bus or admin
    if (req.user.role !== 'admin' && bus.driverId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (currentStop) bus.currentStop = currentStop;
    if (status) bus.status = status;

    await bus.save();
    res.json({ message: 'Bus location updated', bus });
  } catch (error) {
    res.status(500).json({ message: 'Error updating bus location', error: error.message });
  }
});

// Get bus status (All authenticated users)
router.get('/:id/status', authenticate, async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id).populate('driverId', 'name contact email');
    
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.json(bus);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bus status', error: error.message });
  }
});

module.exports = router;

