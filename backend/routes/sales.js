const express = require('express');
const router = express.Router();
const {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
  scanBarcode
} = require('../controllers/saleController');

router.get('/', getAllSales);
router.get('/:id', getSaleById);
router.post('/', createSale);
router.post('/scan', scanBarcode);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);

module.exports = router;