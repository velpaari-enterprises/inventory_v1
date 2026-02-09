const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');  

const {
  getAllProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  addToRTO,
  updateProductRTOStatus,
  getRTOProducts
} = require('../controllers/productController');

router.get('/rto/all', getRTOProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/barcode/:barcode', getProductByBarcode);
router.get('/', getAllProducts);
router.post('/',productController.upload.single('photo'),productController.createProduct);
router.post('/:id/add-to-rto', addToRTO);
router.put('/:id/rto-status', updateProductRTOStatus);
router.put('/:id', productController.upload.single('photo'), updateProduct);
router.delete('/:id', deleteProduct);
router.get('/:id', getProductById);

module.exports = router;