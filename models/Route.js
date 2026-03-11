const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeId: {
    type: String,
    required: true,
    unique: true
  },
  routeName: {
    type: String,
    required: true
  },
  stops: [{
    type: String,
    required: true
  }],
  timings: [{
    type: String,
    required: true
  }],
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    default: null
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Route', routeSchema);

