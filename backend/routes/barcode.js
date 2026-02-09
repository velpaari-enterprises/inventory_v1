const express = require('express');
const router = express.Router();
const { generateVPFashionsBarcode } = require('../config/barcodeGenerator');
const Product = require('../models/Product');
const Combo = require('../models/Combo');
const archiver = require('archiver');

// GET /api/products/:barcode/barcode-image
router.get('/:barcode/barcode-image', async (req, res) => {
  try {
    const barcode = req.params.barcode;
    const response = await Product.findOne({ barcode });
    const imageBuffer = await generateVPFashionsBarcode(response.name, barcode);
    res.set('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate barcode image' });
  }
});

// POST /api/barcode/products/bulk-download
router.post('/products/bulk-download', async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Product IDs array is required' });
    }

    // If only one product, return single image
    if (productIds.length === 1) {
      const product = await Product.findById(productIds[0]);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      const imageBuffer = await generateVPFashionsBarcode(product.name, product.barcode);
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="barcode-${product.barcode}.png"`
      });
      return res.send(imageBuffer);
    }

    // Multiple products - create zip
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="product-barcodes-${Date.now()}.zip"`
    });

    archive.pipe(res);

    // Generate and add each barcode to zip
    for (const productId of productIds) {
      const product = await Product.findById(productId);
      if (product) {
        try {
          const imageBuffer = await generateVPFashionsBarcode(product.name, product.barcode);
          archive.append(imageBuffer, { name: `${product.barcode}-${product.name.replace(/[^a-zA-Z0-9]/g, '_')}.png` });
        } catch (err) {
          console.error(`Error generating barcode for ${product.barcode}:`, err);
        }
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('Bulk download error:', error);
    res.status(500).json({ message: 'Failed to generate barcodes' });
  }
});

// POST /api/barcode/combos/bulk-download
router.post('/combos/bulk-download', async (req, res) => {
  try {
    const { comboIds } = req.body;
    
    if (!comboIds || !Array.isArray(comboIds) || comboIds.length === 0) {
      return res.status(400).json({ message: 'Combo IDs array is required' });
    }

    // If only one combo, return single image
    if (comboIds.length === 1) {
      const combo = await Combo.findById(comboIds[0]);
      if (!combo) {
        return res.status(404).json({ message: 'Combo not found' });
      }
      
      const imageBuffer = await generateVPFashionsBarcode(null, combo.barcode);
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="barcode-${combo.barcode}.png"`
      });
      return res.send(imageBuffer);
    }

    // Multiple combos - create zip
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="combo-barcodes-${Date.now()}.zip"`
    });

    archive.pipe(res);

    // Generate and add each barcode to zip
    for (const comboId of comboIds) {
      const combo = await Combo.findById(comboId);
      if (combo) {
        try {
          const imageBuffer = await generateVPFashionsBarcode(null, combo.barcode);
          archive.append(imageBuffer, { name: `${combo.barcode}.png` });
        } catch (err) {
          console.error(`Error generating barcode for ${combo.barcode}:`, err);
        }
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('Bulk download error:', error);
    res.status(500).json({ message: 'Failed to generate barcodes' });
  }
});

module.exports = router;
