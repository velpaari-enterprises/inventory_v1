const mongoose = require('mongoose');
const { Schema } = mongoose;

const RTOProductSchema = new Schema({
  rtoId: {
    type: String,
    unique: false,
    required: false // Auto-generated
  },
  // Reference back to Return record so we can link and clean up
  returnId: {
    type: Schema.Types.ObjectId,
    ref: 'Return',
    required: false
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  barcode: {
    type: String,
    required: false
  },
  category: {
    type: String,
    enum: ['RTO', 'RPU'],
    required: true,
    default: 'RTO'
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  initialQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  totalValue: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  dateAdded: {
    type: Date,
    default: Date.now
  },
  addedBy: {
    type: String,
    default: 'System'
  },
  notes: {
    type: String,
    trim: true
  },
  reason: {
    type: String,
    enum: ['not_satisfied', 'wrong_item'],
    required: false
  }
}, {
  timestamps: true
});

// Auto-generate rtoId before saving
RTOProductSchema.pre('save', async function(next) {
  if (!this.rtoId) {
    const timestamp = Date.now();
    this.rtoId = `${this.category}${timestamp}`;
  }
  // Set initialQuantity to quantity when creating
  if (this.isNew && (this.initialQuantity === undefined || this.initialQuantity === null || this.initialQuantity === 0)) {
    this.initialQuantity = Number(this.quantity) || 0;
  }
  next();
});

// Index for better query performance
RTOProductSchema.index({ category: 1 });
RTOProductSchema.index({ status: 1 });
RTOProductSchema.index({ dateAdded: -1 });
RTOProductSchema.index({ productName: 1 });

module.exports = mongoose.model('RTOProduct', RTOProductSchema);