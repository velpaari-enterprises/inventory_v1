const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  saleId: {
    type: String,
    unique: true,
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer',
    required: true
  },
  items: [{
    type: {
      type: String,
      enum: ['product', 'combo', 'rto-product'],
      default: 'product'
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: function() {
        return this.type === 'product';
      }
    },
    combo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Combo',
      required: function() {
        return this.type === 'combo';
      }
    },
    comboName: {
      type: String,
      required: function() {
        return this.type === 'combo';
      }
    },
    rtoProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RTOProduct',
      required: function() {
        return this.type === 'rto-product';
      }
    },
    productName: {
      type: String,
      required: function() {
        return this.type === 'rto-product';
      }
    },
    quantity: {
      type: Number,
      default: 1
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
    },
    barcode: {
      type: String
    }
  }],
  subtotal: {
    type: Number,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  shipping: {
    type: Number,
    default: 0,
    min: 0
  },
  other: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  saleDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'rpu', 'returned', 'delivered'],
    default: 'completed'
  }
}, {
  timestamps: true
});



// Generate sale ID before saving
saleSchema.pre('validate', async function(next) {
  if (this.isNew && !this.saleId) {
    const count = await mongoose.model('Sale').countDocuments();
    this.saleId = `SALE-${Date.now()}-${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Sale', saleSchema);