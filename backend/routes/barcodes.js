const express = require('express');
const router = express.Router();
const {
  generateBarcode,
  getProductByBarcode
} = require('../controllers/barcodeController');

router.get('/product-item/:productItemId', generateBarcode);
router.get('/:barcode', getProductByBarcode);

module.exports = router;