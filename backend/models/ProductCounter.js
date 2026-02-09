const mongoose = require('mongoose');

const productCounterSchema = new mongoose.Schema({
  categoryCode: {
    type: String,
    required: true,
    unique: true
  },
  counter: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProductCounter', productCounterSchema);