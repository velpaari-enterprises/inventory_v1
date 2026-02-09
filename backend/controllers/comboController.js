const Combo = require('../models/Combo');
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const mongoose = require('mongoose');
const { emitEvent } = require('../utils/socket');

const storage = multer.memoryStorage();

// Get all combos
exports.getAllCombos = async (req, res) => {
  try {
    const combos = await Combo.find({ isActive: true })
      .populate('category', 'name code')
      .populate('products.product', 'name price barcode quantity')
      .sort({ createdAt: -1 });
    
    // Calculate available combo count based on product stock
    const combosWithAvailability = combos.map(combo => {
      let availableCount = 0;
      let productDetails = [];
      
      if (combo.products && combo.products.length > 0) {
        // Calculate how many combos can be made with current stock
        const availableCounts = combo.products.map(cp => {
          if (!cp.product || cp.product.quantity === undefined) {
            productDetails.push({
              ...cp.toObject(),
              availableStock: 0,
              canMake: 0,
              stockStatus: 'unavailable'
            });
            return 0;
          }
          
          const canMake = Math.floor(cp.product.quantity / cp.quantity);
          const stockStatus = cp.product.quantity === 0 ? 'out-of-stock' : 
                            cp.product.quantity < cp.quantity ? 'insufficient' : 'available';
          
          productDetails.push({
            ...cp.toObject(),
            availableStock: cp.product.quantity,
            canMake: canMake,
            stockStatus: stockStatus
          });
          
          return canMake;
        });
        
        availableCount = Math.min(...availableCounts);
      }
      
      return {
        ...combo.toObject(),
        availableCount: availableCount,
        productDetails: productDetails
      };
    });
    
    res.json(combosWithAvailability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get combo by ID
exports.getComboById = async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id)
      .populate('products.product', 'name price barcode quantity');
    if (!combo) {
      return res.status(404).json({ message: 'Combo not found' });
    }
    
    // Calculate availability for this specific combo
    let availableCount = 0;
    let productDetails = [];
    
    if (combo.products && combo.products.length > 0) {
      const availableCounts = combo.products.map(cp => {
        if (!cp.product || cp.product.quantity === undefined) {
          productDetails.push({
            ...cp.toObject(),
            availableStock: 0,
            canMake: 0,
            stockStatus: 'unavailable'
          });
          return 0;
        }
        
        const canMake = Math.floor(cp.product.quantity / cp.quantity);
        const stockStatus = cp.product.quantity === 0 ? 'out-of-stock' : 
                          cp.product.quantity < cp.quantity ? 'insufficient' : 'available';
        
        productDetails.push({
          ...cp.toObject(),
          availableStock: cp.product.quantity,
          canMake: canMake,
          stockStatus: stockStatus
        });
        
        return canMake;
      });
      
      availableCount = Math.min(...availableCounts);
    }
    
    const comboWithAvailability = {
      ...combo.toObject(),
      availableCount: availableCount,
      productDetails: productDetails
    };
    
    res.json(comboWithAvailability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get combo by barcode
exports.getComboByBarcode = async (req, res) => {
  try {
    const combo = await Combo.findOne({ barcode: req.params.barcode, isActive: true })
      .populate('products.product', 'name price barcode');
    if (!combo) {
      return res.status(404).json({ message: 'Combo not found' });
    }
    res.json(combo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new combo
exports.createCombo = async (req, res) => {
  try {
    // Check if barcode is provided
    if (!req.body.barcode) {
      return res.status(400).json({ message: 'Barcode is required' });
    }

    // Check if barcode already exists
    const existingCombo = await Combo.findOne({ barcode: req.body.barcode, isActive: true });
    if (existingCombo) {
      return res.status(400).json({ message: 'Barcode already exists' });
    }

    // Upload image if provided
    let imageUrl = null;
    if (req.file) {
      const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const uploadResponse = await cloudinary.uploader.upload(fileStr, {
        folder: 'inventory-combos',
        transformation: [{ width: 800, height: 600, crop: 'limit' }, { quality: 'auto' }]
      });
      imageUrl = uploadResponse.secure_url;
    }

    const combo = new Combo({
      ...req.body,
      products: JSON.parse(req.body.products),
      imageUrl: imageUrl
    });

    const savedCombo = await combo.save();
    emitEvent('combos:changed', { action: 'created', id: savedCombo._id });
    res.status(201).json(savedCombo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update combo
exports.updateCombo = async (req, res) => {
  try {
    const existingCombo = await Combo.findById(req.params.id);
    if (!existingCombo) {
      return res.status(404).json({ message: 'Combo not found' });
    }

    let updateData = { ...req.body };
    if (updateData.products) {
      updateData.products = JSON.parse(updateData.products);
    }

    // Handle image deletion
    if (req.body.deleteImage === 'true' && existingCombo.imageUrl) {
      const publicId = `inventory-combos/${existingCombo.imageUrl.split('/').pop().split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId);
      updateData.imageUrl = null;
    }

    // Upload new image if provided
    if (req.file) {
      if (existingCombo.imageUrl) {
        const publicId = `inventory-combos/${existingCombo.imageUrl.split('/').pop().split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      }
      const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const uploadResponse = await cloudinary.uploader.upload(fileStr, {
        folder: 'inventory-combos',
        transformation: [{ width: 800, height: 600, crop: 'limit' }, { quality: 'auto' }]
      });
      updateData.imageUrl = uploadResponse.secure_url;
    }
    delete updateData.deleteImage;

    const combo = await Combo.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    emitEvent('combos:changed', { action: 'updated', id: combo?._id || req.params.id });
    res.json(combo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete combo (soft delete)
exports.deleteCombo = async (req, res) => {
  try {
    const comboId = req.params.id;
    console.log('Delete combo request received for ID:', comboId);
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(comboId)) {
      console.log('Invalid ObjectId format:', comboId);
      return res.status(400).json({ message: 'Invalid combo ID format' });
    }
    
    const combo = await Combo.findById(comboId);
    if (!combo) {
      console.log('Combo not found with ID:', comboId);
      return res.status(404).json({ message: 'Combo not found' });
    }
    
    // Check if already deleted
    if (combo.isActive === false) {
      console.log('Combo already deleted:', combo.name);
      return res.status(400).json({ message: 'Combo is already deleted' });
    }
    
    console.log('Found combo:', combo.name, '- Setting isActive to false');
    combo.isActive = false;
    await combo.save();
    
    console.log('Combo deleted successfully:', combo.name);
    emitEvent('combos:changed', { action: 'deleted', id: combo._id });
    res.json({ 
      message: 'Combo deleted successfully',
      success: true,
      combo: {
        id: combo._id,
        name: combo.name,
        isActive: combo.isActive
      }
    });
  } catch (error) {
    console.error('Error deleting combo:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: error.message,
      error: error.toString()
    });
  }
};

// Get unmapped combos (combos where products are not manually mapped)
exports.getUnmappedCombos = async (req, res) => {
  try {
    const unmappedCombos = await Combo.find({ isActive: true, isMapped: false })
      .populate('category', 'name code')
      .select('barcode name category price products isMapped')
      .sort({ createdAt: -1 });
    
    const totalCombos = await Combo.countDocuments({ isActive: true });
    const mappedCount = await Combo.countDocuments({ isActive: true, isMapped: true });
    
    res.json({
      unmappedCombos,
      totalCombos,
      unmappedCount: unmappedCombos.length,
      mappedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add product to combo
exports.addProductToCombo = async (req, res) => {
  try {
    const { product, quantity } = req.body;
    const comboId = req.params.id;

    if (!product || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Product and valid quantity are required' });
    }

    // Check if product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const combo = await Combo.findById(comboId);
    if (!combo) {
      return res.status(404).json({ message: 'Combo not found' });
    }

    // Check if product already exists in combo
    const existingProductIndex = combo.products.findIndex(
      p => p.product.toString() === product
    );

    if (existingProductIndex !== -1) {
      // Update quantity if product already exists
      combo.products[existingProductIndex].quantity += parseInt(quantity);
    } else {
      // Add new product to combo
      combo.products.push({ product, quantity: parseInt(quantity) });
    }

    await combo.save();
    
    const updatedCombo = await Combo.findById(comboId)
      .populate('products.product', 'name price barcode');
    
    emitEvent('combos:changed', { action: 'updated', id: updatedCombo._id });
    res.json(updatedCombo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Multer upload middleware
exports.upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    if (filetypes.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only jpeg, jpg, png files are allowed!'), false);
    }
  }
});