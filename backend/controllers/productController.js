const Product = require('../models/Product');
const ProductItem = require('../models/ProductItem');
const cloudinary = require('../config/cloudinary');
const { emitEvent } = require('../utils/socket');

const multer = require('multer');
const path = require('path');
const storage = multer.memoryStorage();

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('vendor', 'name contactPerson')
      .populate('category', 'name code')
      .sort({ createdAt: -1 });

      
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('vendor', 'name contactPerson phone')
      .populate('category', 'name code');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get product by barcode
exports.getProductByBarcode = async (req, res) => {
  try {
    const product = await Product.findOne({ barcode: req.params.barcode })
      .populate('vendor', 'name contactPerson phone')
      .populate('category', 'name code');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const Category = require('../models/Category');
    const ProductCounter = require('../models/ProductCounter');
    
    // Get category information
    const category = await Category.findById(req.body.category);
    if (!category) {
      return res.status(400).json({ message: 'Invalid category selected' });
    }

    // Generate barcode with category code
    let counter = await ProductCounter.findOne({ categoryCode: category.code });
    
    if (!counter) {
      // Create new counter for this category
      counter = new ProductCounter({ 
        categoryCode: category.code, 
        counter: 1 
      });
    } else {
      // Increment existing counter
      counter.counter += 1;
    }
    
    await counter.save();
    
    // Generate barcode: IM + categoryCode + VP + 4-digit counter
    const barcode = `IM${category.code}VP${counter.counter.toString().padStart(4, '0')}`;

    // Upload image if provided
    let imageUrl = null;
    if (req.file) {
      try {
        // Convert buffer to base64 string for Cloudinary upload
        const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
        const uploadResponse = await cloudinary.uploader.upload(fileStr, {
          folder: 'inventory-products',
          transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto' }
          ]
        });

        imageUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ message: 'Image upload failed' });
      }
    }

    const product = new Product({ ...req.body, barcode, image: imageUrl });
    const savedProduct = await product.save();

    emitEvent('products:changed', { action: 'created', id: savedProduct._id });
    emitEvent('inventory:changed', { action: 'created', id: savedProduct._id });
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};  

// Update product
exports.updateProduct = async (req, res) => {
  try {
    // Get the existing product first
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let updateData = { ...req.body };
    
    // Handle image deletion
    if (req.body.deleteImage === 'true' && existingProduct.image) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = existingProduct.image.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = `inventory-products/${filename.split('.')[0]}`;
        
        await cloudinary.uploader.destroy(publicId);
        updateData.image = null;
      } catch (cloudinaryError) {
        console.error('Failed to delete old image from Cloudinary:', cloudinaryError);
        // Continue with update even if image deletion fails
      }
    }
    
    // Upload new image if provided
    if (req.file) {
      try {
        // Delete old image from Cloudinary if it exists
        if (existingProduct.image) {
          try {
            const urlParts = existingProduct.image.split('/');
            const filename = urlParts[urlParts.length - 1];
            const publicId = `inventory-products/${filename.split('.')[0]}`;
            
            await cloudinary.uploader.destroy(publicId);
          } catch (cloudinaryError) {
            console.error('Failed to delete old image from Cloudinary:', cloudinaryError);
            // Continue with new image upload even if old image deletion fails
          }
        }

        // Convert buffer to base64 string for Cloudinary upload
        const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
        const uploadResponse = await cloudinary.uploader.upload(fileStr, {
          folder: 'inventory-products',
          transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto' }
          ]
        });

        updateData.image = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ message: 'Image upload failed' });
      }
    }

    // Remove deleteImage flag from updateData as it's not a model field
    delete updateData.deleteImage;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    emitEvent('products:changed', { action: 'updated', id: product._id });
    emitEvent('inventory:changed', { action: 'updated', id: product._id });
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Delete image from Cloudinary if it exists
    if (product.image) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = product.image.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = `inventory-products/${filename.split('.')[0]}`;
        
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error('Failed to delete image from Cloudinary:', cloudinaryError);
        // Continue with product deletion even if image deletion fails
      }
    }
    
    // Delete the product
    await Product.findByIdAndDelete(req.params.id);
    
    // Also delete all product items
    await ProductItem.deleteMany({ product: req.params.id });
    
    emitEvent('products:changed', { action: 'deleted', id: product._id });
    emitEvent('inventory:changed', { action: 'deleted', id: product._id });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get low stock products
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$quantity', '$minquantity'] }
    }).populate('vendor', 'name');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Add product to RTO/RPU
exports.addToRTO = async (req, res) => {
  try {
    const { productId, category, quantity, reason, notes } = req.body;
    const RTOProduct = require('../models/RTOProduct');

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
      price: product.price,
      totalValue: product.price * quantity,
      reason: reason,
      notes: notes
    });

    await rtoProduct.save();
    res.status(201).json(rtoProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProductRTOStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { rtoStatus, rtoQuantity, rtoReason } = req.body;

    if (!['none', 'RTO', 'RPU'].includes(rtoStatus)) {
      return res.status(400).json({ message: 'Invalid RTO status' });
    }

    const updateData = {
      rtoStatus,
      rtoQuantity: rtoQuantity || 0,
      rtoReason: rtoReason || null,
      rtoDate: rtoStatus === 'none' ? null : new Date()
    };

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('vendor', 'name').populate('category', 'name');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      message: 'Product RTO/RPU status updated successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRTOProducts = async (req, res) => {
  try {
    const { status } = req.query;
    
    const filter = { rtoStatus: { $ne: 'none' } };
    if (status && ['RTO', 'RPU'].includes(status)) {
      filter.rtoStatus = status;
    }

    const products = await Product.find(filter)
      .populate('vendor', 'name')
      .populate('category', 'name')
      .sort({ rtoDate: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only jpeg, jpg, png files are allowed!'), false);
    }
  }
});
