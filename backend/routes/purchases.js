const express = require('express');
const router = express.Router();
const {
  getAllPurchases,
  getPurchaseById,
  createPurchase,
  generatePurchaseBarcodes
} = require('../controllers/purchaseController');

router.get('/', getAllPurchases);
router.get('/:id', getPurchaseById);
router.post('/', createPurchase);
router.get('/:id/barcodes', generatePurchaseBarcodes);

module.exports = router;