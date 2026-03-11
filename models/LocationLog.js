const mongoose = require('mongoose');

const locationLogSchema = new mongoose.Schema({
  logId: {
    type: String,
    required: true,
    unique: true
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  currentStop: {
    type: String,
    required: true
  },
  nextStop: {
    type: String,
    default: ''
  },
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LocationLog', locationLogSchema);

