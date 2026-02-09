const mongoose = require('mongoose');

const comboProductSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, { _id: false });

const comboSchema = new mongoose.Schema({
  comboId: {
    type: String,
    unique: true,
    default: function() {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      return `COMBO-${timestamp}-${random}`;
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  barcode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  products: [comboProductSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  isMapped: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Generate comboId before saving
comboSchema.pre('save', async function(next) {
  if (this.isNew && !this.comboId) {
    try {
      const count = await this.constructor.countDocuments();
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      this.comboId = `COMBO-${timestamp}-${count + 1}-${random}`;
    } catch (error) {
      console.error('Error generating comboId:', error);
      // Fallback ID generation
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      this.comboId = `COMBO-${timestamp}-${random}`;
    }
  }
  next();
});

comboSchema.index({ barcode: 1 });
comboSchema.index({ name: 1 });

module.exports = mongoose.model('Combo', comboSchema);