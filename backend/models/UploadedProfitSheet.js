const mongoose = require('mongoose');
const { Schema } = mongoose;

const UploadedProfitRowSchema = new Schema({
  month: { type: String, default: '' },
  sno: { type: String, default: '' },
  orderDate: { type: String, default: '' },
  orderId: { type: String, default: '' },
  sku: { type: String, default: '' },
  quantity: { type: String, default: '' },
  status: { type: String, default: '' },
  payment: { type: String, default: '' },
  paymentDate: { type: String, default: '' },
  paymentStatus: { type: String, default: '' },
  purchasePrice: { type: String, default: '' },
  profit: { type: String, default: '' },
  reuseOrClaim: { type: String, default: '' },
  reusedDate: { type: String, default: '' },
  statusOfProduct: { type: String, default: '' },
  remarks: { type: String, default: '' },
});

const UploadedProfitSheetSchema = new Schema({
  fileName: { type: String, required: true },
  uploadedData: { type: [UploadedProfitRowSchema], default: [] },
  totalRecords: { type: Number, default: 0 },
  successRecords: { type: Number, default: 0 },
  errorRecords: { type: Number, default: 0 },
  profitSummary: {
    totalProfit: { type: Number, default: 0 },
    deliveredProfit: { type: Number, default: 0 },
    rpuProfit: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
  },
  notes: { type: String, default: '' },
  status: { type: String, default: 'uploaded' },
  uploadDate: { type: Date, default: Date.now },
}, {
  timestamps: true
});

// Indexes
UploadedProfitSheetSchema.index({ uploadDate: -1 });
UploadedProfitSheetSchema.index({ fileName: 1 });
UploadedProfitSheetSchema.index({ status: 1 });

module.exports = mongoose.model('UploadedProfitSheet', UploadedProfitSheetSchema);