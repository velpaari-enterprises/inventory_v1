const express = require('express');
const router = express.Router();
const RTOProduct = require('../models/RTOProduct');
const Product = require('../models/Product');

// GET summary statistics (MUST come before /:id to avoid matching as ID)
router.get('/stats/summary', async (req, res) => {
  try {
    const rtoStats = await RTOProduct.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalValue' },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    const statusStats = await RTOProduct.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      byCategory: rtoStats,
      byStatus: statusStats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET all RTO/RPU products with filtering
router.get('/', async (req, res) => {
  try {
    const { category, status, search, startDate, endDate } = req.query;

    // Build filter object
    const filter = {};
    
    if (category && (category === 'RTO' || category === 'RPU')) {
      filter.category = category;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { rtoId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.dateAdded = {};
      if (startDate) {
        filter.dateAdded.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.dateAdded.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      }
    }

    const rtoProducts = await RTOProduct.find(filter)
      .populate('product', 'name barcode price')
      .sort({ dateAdded: -1 });

    res.json(rtoProducts);
  } catch (error) {
    console.error('Error fetching RTO products:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET single RTO product
router.get('/:id', async (req, res) => {
  try {
    const rtoProduct = await RTOProduct.findById(req.params.id)
      .populate('product', 'name barcode price');

    if (!rtoProduct) {
      return res.status(404).json({ message: 'RTO product not found' });
    }

    res.json(rtoProduct);
  } catch (error) {
    console.error('Error fetching RTO product:', error);
    res.status(500).json({ message: error.message });
  }
});

// CREATE new RTO/RPU product
router.post('/', async (req, res) => {
  try {
    const { productId, category, quantity, reason, notes } = req.body;

    // Validate required fields
    if (!productId || !category || !quantity) {
      return res.status(400).json({ message: 'Product ID, category, and quantity are required' });
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Create RTO product
    const rtoProduct = new RTOProduct({
      product: productId,
      productName: product.name,
      barcode: product.barcode,
      category: category,
      quantity: quantity,
      initialQuantity: quantity,
      price: product.price,
      totalValue: product.price * quantity,
      reason: reason,
      notes: notes
    });

    await rtoProduct.save();

    // Also increase the main product inventory
    await Product.findByIdAndUpdate(productId, { 
      $inc: { quantity: quantity } 
    });

    res.status(201).json(rtoProduct);
  } catch (error) {
    console.error('Error creating RTO product:', error);
    res.status(500).json({ message: error.message });
  }
});

// UPDATE RTO/RPU product
router.put('/:id', async (req, res) => {
  try {
    const { status, quantity, notes, reason } = req.body;

    const rtoProduct = await RTOProduct.findById(req.params.id);
    if (!rtoProduct) {
      return res.status(404).json({ message: 'RTO product not found' });
    }

    // Update fields
    if (status) rtoProduct.status = status;
    if (quantity && quantity !== rtoProduct.quantity) {
      const quantityDiff = quantity - rtoProduct.quantity;
      rtoProduct.quantity = quantity;
      rtoProduct.totalValue = rtoProduct.price * quantity;
      
      // Update main product inventory accordingly
      await Product.findByIdAndUpdate(rtoProduct.product, { 
        $inc: { quantity: quantityDiff } 
      });
    }
    if (notes !== undefined) rtoProduct.notes = notes;
    if (reason) rtoProduct.reason = reason;

    await rtoProduct.save();

    res.json(rtoProduct);
  } catch (error) {
    console.error('Error updating RTO product:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE RTO/RPU product
router.delete('/:id', async (req, res) => {
  try {
    const rtoProduct = await RTOProduct.findById(req.params.id);

    if (!rtoProduct) {
      return res.status(404).json({ message: 'RTO product not found' });
    }

    // Decrease main product inventory
    await Product.findByIdAndUpdate(rtoProduct.product, { 
      $inc: { quantity: -rtoProduct.quantity } 
    });

    // Delete RTO product
    await RTOProduct.findByIdAndDelete(req.params.id);

    res.json({ message: 'RTO product deleted successfully' });
  } catch (error) {
    console.error('Error deleting RTO product:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;