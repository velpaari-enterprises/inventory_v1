const ProductItem = require('../models/ProductItem');
const { generateVPFashionsBarcode } = require('../config/barcodeGenerator');

// Generate barcode for a product item
exports.generateBarcode = async (req, res) => {
  try {
    const { productItemId } = req.params;

    const productItem = await ProductItem.findById(productItemId)
      .populate('product', 'name');

    if (!productItem) {
      return res.status(404).json({ message: 'Product item not found' });
    }

    const barcodeBuffer = await generateVPFashionsBarcode(productItem.barcode);

    res.json({
      barcode: productItem.barcode,
      productName: productItem.product.name,
      barcodeData: barcodeBuffer.toString('base64')
    });


  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get product by barcode
exports.getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    const productItem = await ProductItem.findOne({ barcode })
      .populate('product', 'name description category price')
      .populate('purchase', 'purchaseDate');

    if (!productItem) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      productItem: productItem._id,
      product: productItem.product,
      status: productItem.status,
      price: productItem.sellingPrice
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};