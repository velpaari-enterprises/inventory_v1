const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const ProductItem = require('../models/ProductItem');
const { generateBarcode } = require('../config/barcodeGenerator');
const { emitEvent } = require('../utils/socket');

// Get all purchases
exports.getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('vendor', 'name contactPerson')
      .populate('items.product', 'name category')
      .sort({ purchaseDate: -1 });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get purchase by ID
exports.getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('vendor', 'name contactPerson phone email address')
      .populate('items.product', 'name description category');
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new purchase
exports.createPurchase = async (req, res) => {
  console.log("Called Purchase")
  
  try {
    const { vendor, items, purchaseDate } = req.body;
    
    // Calculate totals
    let totalAmount = 0;
    const purchaseItems = [];
    
    for (const item of items) {
      // Backend expects: unitCost (mapped from costPrice), sellingPrice, quantity
      const unitCost = Number(item.unitCost);
      const sellingPrice = Number(item.sellingPrice);
      const quantity = Number(item.quantity);

      const itemTotal = quantity * unitCost;
      totalAmount += itemTotal;
      
      purchaseItems.push({
        product: item.product,
        quantity: quantity,
        unitCost: unitCost,
        total: itemTotal
      });
      
      // Update product quantity AND prices
      // Update costPrice and sellingPrice in Product master
      await Product.findByIdAndUpdate(
        item.product,
        { 
          $inc: { quantity: quantity },
          $set: { 
            costPrice: unitCost,
            sellingPrice: sellingPrice
          }
        }
      );
    }
    
    // Create purchase
    const purchase = new Purchase({
      vendor,
      items: purchaseItems,
      totalAmount,
      purchaseDate: purchaseDate || new Date()
    });
    
    const savedPurchase = await purchase.save();
    
    // Generate product items and assign the product's barcode to each item
    for (const item of items) {
      const unitCost = Number(item.unitCost);
      const sellingPrice = Number(item.sellingPrice);
      const quantity = Number(item.quantity);

      // Get the product's barcode
      const productDoc = await Product.findById(item.product);
      
      for (let i = 0; i < quantity; i++) {
        const productItem = new ProductItem({
          product: item.product,
          barcode: productDoc.barcode,
          purchase: savedPurchase._id,
          purchasePrice: unitCost,
          sellingPrice: sellingPrice // Use specific selling price from PO
        });
        await productItem.save();
      }
    }
    
    const populatedPurchase = await Purchase.findById(savedPurchase._id)
      .populate('vendor', 'name contactPerson')
      .populate('items.product', 'name category');
    
    emitEvent('purchases:changed', { action: 'created', id: populatedPurchase._id });
    emitEvent('inventory:changed', { action: 'purchase-created', id: populatedPurchase._id });
    res.status(201).json(populatedPurchase);

  } catch (error) {
    console.log("Error in createPurchase:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// Generate barcodes for a purchase
exports.generatePurchaseBarcodes = async (req, res) => {
  try {
    const purchaseId = req.params.id;
    const productItems = await ProductItem.find({ purchase: purchaseId })
      .populate('product', 'name');
    
    const barcodePromises = productItems.map(async (item) => {
      const barcodeBuffer = await generateBarcode(item.barcode);
      return {
        barcode: item.barcode,
        productName: item.product.name,
        barcodeData: barcodeBuffer.toString('base64')
      };
    });
    
    const barcodes = await Promise.all(barcodePromises);
    res.json(barcodes);



  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};