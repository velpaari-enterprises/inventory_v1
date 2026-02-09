const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const productItemSchema = new mongoose.Schema({


  barcode: {
    type: String,
    required: true
  },



  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },


  status: {
    type: String,
    enum: ['in_stock', 'sold', 'returned', 'damaged'],
    default: 'in_stock'
  },
  purchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase',
    required: true
  },
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    default: null
  },
  purchasePrice: {
    type: Number,
    required: true
  },
  sellingPrice: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProductItem', productItemSchema);