const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
  allocationId: {
    type: String,
    required: true,
    unique: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  assignedStop: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Allocation', allocationSchema);

