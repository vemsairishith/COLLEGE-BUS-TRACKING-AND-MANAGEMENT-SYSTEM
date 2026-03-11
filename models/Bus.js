const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busId: {
    type: String,
    required: true,
    unique: true
  },
  busNumber: {
    type: String,
    required: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['Active', 'Maintenance', 'Running', 'Delayed', 'Reached Destination'],
    default: 'Active'
  },
  currentStop: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Bus', busSchema);

