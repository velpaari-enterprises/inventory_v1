const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  gstNo: {
    type: String,
    required: true,
    trim: true
  },
  accountNo: {
    type: String,
    required: true,
    trim: true
  },
  ifscCode: {
    type: String,
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Vendor', vendorSchema);