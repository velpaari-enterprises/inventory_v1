const Return = require('../models/Return');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Get all returns
const getAllReturns = async (req, res) => {
  try {
    const returns = await Return.find()
      .populate('items.product', 'name category barcode price')
      .sort({ createdAt: -1 });
    
    res.status(200).json(returns);
  } catch (error) {
    console.error('Error fetching returns:', error);
    res.status(500).json({ 
      message: 'Failed to fetch returns', 
      error: error.message 
    });
  }
};

// Get return by ID
const getReturnById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const returnRecord = await Return.findById(id)
      .populate('items.product', 'name category barcode price description');
    
    if (!returnRecord) {
      return res.status(404).json({ message: 'Return not found' });
    }
    
    res.status(200).json(returnRecord);
  } catch (error) {
    console.error('Error fetching return:', error);
    res.status(500).json({ 
      message: 'Failed to fetch return', 
      error: error.message 
    });
  }
};

// Get returns by category
const getReturnsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!['RTO', 'RPU'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category. Must be RTO or RPU' });
    }
    
    const returns = await Return.find({ category })
      .populate('items.product', 'name category barcode price')
      .sort({ createdAt: -1 });
    
    res.status(200).json(returns);
  } catch (error) {
    console.error('Error fetching returns by category:', error);
    res.status(500).json({ 
      message: 'Failed to fetch returns by category', 
      error: error.message 
    });
  }
};

// Create new return
const createReturn = async (req, res) => {
  try {
    const {
      category,
      returnDate,
      customerName,
      customerPhone,
      customerEmail,
      reason,
      items,
      totalAmount,
      comments,
      status = 'processed'
    } = req.body;

    // Validate required fields
    if (!category || !customerName || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Missing required fields: category, customerName, and items are required'
      });
    }

    // Validate category
    if (!['RTO', 'RPU'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category. Must be RTO or RPU' });
    }

    // Validate and process items
    const processedItems = [];
    const productUpdates = [];

    for (const item of items) {
      if (!item.product || !item.quantity || !item.unitPrice) {
        return res.status(400).json({
          message: 'Each item must have product, quantity, and unitPrice'
        });
      }

      // Verify product exists
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          message: `Product with ID ${item.product} not found`
        });
      }

      // Calculate item total
      const itemTotal = item.quantity * item.unitPrice;

      processedItems.push({
        product: item.product,
        productName: item.productName || product.name,
        barcode: item.barcode || product.barcode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: itemTotal
      });

      // For RTO category, prepare product quantity updates (increase inventory)
      // For RPU category, no product quantity updates - just maintain records
      if (category === 'RTO') {
        productUpdates.push({
          updateOne: {
            filter: { _id: item.product },
            update: { $inc: { quantity: item.quantity } }
          }
        });
      }
      // RPU: No product updates, just record keeping
    }

    // Generate a unique return ID
    let returnId;
    try {
      const lastReturn = await Return.findOne({}, {}, { sort: { 'createdAt': -1 } });
      let nextId = 1000;
      
      if (lastReturn && lastReturn.returnId) {
        const lastIdNumber = parseInt(lastReturn.returnId.replace(/\D/g, ''), 10);
        if (!isNaN(lastIdNumber)) {
          nextId = lastIdNumber + 1;
        }
      }
      
      returnId = `RET${nextId}`;
    } catch (error) {
      // Fallback to timestamp-based ID if there's an error
      returnId = `RET${Date.now()}`;
    }

    // Create the return record
    const newReturn = new Return({
      returnId,
      category,
      returnDate: returnDate || new Date(),
      customerName,
      customerPhone,
      customerEmail,
      reason,
      items: processedItems,
      totalAmount: totalAmount || processedItems.reduce((sum, item) => sum + item.total, 0),
      comments,
      status,
      processedAt: new Date()
    });

    // Save the return record
    const savedReturn = await newReturn.save();

    // Update product quantities only for RTO category (restore inventory)
    // RPU only maintains records without quantity updates
    if (category === 'RTO' && productUpdates.length > 0) {
      await Product.bulkWrite(productUpdates);
    }

    // Also create RTOProduct documents for each item so RTO inventory can be tracked separately
    if (category === 'RTO' && processedItems.length > 0) {
      const RTOProduct = require('../models/RTOProduct');
      const timestamp = Date.now();
      const rtoDocs = processedItems.map((item, index) => ({
        rtoId: `RTO${timestamp}${index}`,
        product: item.product,
        productName: item.productName,
        barcode: item.barcode,
        category: 'RTO',
        quantity: item.quantity,
        initialQuantity: item.quantity,
        price: item.unitPrice || 0,
        totalValue: item.unitPrice ? item.unitPrice * item.quantity : 0,
        status: 'pending',
        dateAdded: new Date(),
        addedBy: customerName || 'Customer',
        notes: comments || '',
        reason: reason || '',
        returnId: savedReturn._id
      }));
      // Insert docs
      await RTOProduct.insertMany(rtoDocs);
    }

    // Populate the saved return for response
    const populatedReturn = await Return.findById(savedReturn._id)
      .populate('items.product', 'name category barcode price');

    const message = category === 'RTO' 
      ? `${category} return processed successfully and inventory quantities updated`
      : `${category} return recorded successfully (record only, no inventory changes)`;
    
    res.status(201).json({
      message: message,
      return: populatedReturn,
      returnId: savedReturn.returnId
    });

  } catch (error) {
    console.log("Hello"+error);
    console.error('Error creating return:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationErrors
      });
    }


    
    res.status(500).json({ 
      message: 'Failed to create return', 
      error: error.message 
    });
  }
};

// Update return
const updateReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.returnId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const updatedReturn = await Return.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('items.product', 'name category barcode price');

    if (!updatedReturn) {
      return res.status(404).json({ message: 'Return not found' });
    }

    res.status(200).json({
      message: 'Return updated successfully',
      return: updatedReturn
    });
  } catch (error) {
    console.error('Error updating return:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to update return', 
      error: error.message 
    });
  }
};

// Delete return
const deleteReturn = async (req, res) => {
  try {
    const { id } = req.params;

    const returnRecord = await Return.findById(id);
    if (!returnRecord) {
      return res.status(404).json({ message: 'Return not found' });
    }

    // Only reverse product quantity changes for RTO returns
    // RPU returns don't affect inventory, so no quantity adjustments needed
    if (returnRecord.category === 'RTO' && returnRecord.status === 'processed') {
      const productUpdates = returnRecord.items.map(item => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { quantity: -item.quantity } }
        }
      }));
      
      if (productUpdates.length > 0) {
        await Product.bulkWrite(productUpdates);
      }
      // Remove associated RTOProduct docs created for this Return
      const RTOProduct = require('../models/RTOProduct');
      await RTOProduct.deleteMany({ returnId: returnRecord._id });
    }
    // For RPU: No product quantity adjustments needed during deletion

    await Return.findByIdAndDelete(id);

    const deleteMessage = returnRecord.category === 'RTO'
      ? 'RTO return deleted successfully and product quantities adjusted'
      : 'RPU return deleted successfully (no inventory changes)';

    res.status(200).json({ 
      message: deleteMessage
    });
  } catch (error) {
    console.error('Error deleting return:', error);
    res.status(500).json({ 
      message: 'Failed to delete return', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllReturns,
  getReturnById,
  getReturnsByCategory,
  createReturn,
  updateReturn,
  deleteReturn
};