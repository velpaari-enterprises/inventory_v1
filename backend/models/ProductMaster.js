const mongoose = require('mongoose');

const productMasterSchema = new mongoose.Schema({
  sNo: {
    type: Number,
    required: true
  },
  productCategory: {
    type: String,
    required: true,
    trim: true
  },
  sellingProductCode: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  pricePerProduct: {
    type: Number,
    required: true,
    min: 0
  },
  priceWithGST: {
    type: Number,
    required: true,
    min: 0
  },
  uploadedDate: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: String,
    default: 'System'
  }
}, {
  timestamps: true
});

// Index for better query performance
productMasterSchema.index({ sellingProductCode: 1 });
productMasterSchema.index({ productCategory: 1 });
productMasterSchema.index({ productName: 1 });

module.exports = mongoose.model('ProductMaster', productMasterSchema);
