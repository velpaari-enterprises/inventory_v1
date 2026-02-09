const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  }, 
  barcode: {
    type: String,
    required: true,
    unique: true
  },


  description: {
    type: String,
    trim: true
  },


  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },

  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: false,
    min: 0
  },
  minquantity: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    min: 0,
    default: 0
  },
  reorderLevel: {
    type: Number,
    default: 5
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  image: {
    type: String,
    default: null
  },
  rtoStatus: {
    type: String,
    enum: ['none', 'RTO', 'RPU'],
    default: 'none'
  },
  rtoQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  rtoReason: {
    type: String,
    enum: ['defective', 'wrong_item', 'damaged', 'not_satisfied', 'warranty_claim', 'other'],
    default: null
  },
  rtoDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);