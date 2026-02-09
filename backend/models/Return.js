const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReturnItemSchema = new Schema({
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
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
});

const ReturnSchema = new Schema({
  returnId: {
    type: String,
    unique: true,
    required: false // Auto-generated, so not required on input
  },
  category: {
    type: String,
    enum: ['RTO', 'RPU'],
    required: true
  },
  returnDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  reason: {
    type: String,
    enum: ['not_satisfied', 'wrong_item'],
    required: true
  },
  items: [ReturnItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  comments: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'completed', 'cancelled'],
    default: 'pending'
  },
  processedBy: {
    type: String,
    default: 'System'
  },
  processedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Auto-generate returnId before saving
ReturnSchema.pre('save', async function(next) {
  if (!this.returnId) {
    // Generate a simple ID using timestamp to avoid async issues in pre-save
    const timestamp = Date.now();
    this.returnId = `RET${timestamp}`;
  }
  next();
});

// Index for better query performance
ReturnSchema.index({ category: 1 });
ReturnSchema.index({ returnDate: -1 });
ReturnSchema.index({ customerName: 1 });
ReturnSchema.index({ status: 1 });

module.exports = mongoose.model('Return', ReturnSchema);