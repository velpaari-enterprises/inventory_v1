const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^[0-9]{3}$/  // Must be exactly 3 digits
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
categorySchema.index({ code: 1 });
categorySchema.index({ name: 1 });

module.exports = mongoose.model('Category', categorySchema);