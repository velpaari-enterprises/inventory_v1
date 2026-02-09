// Update sale
exports.updateSale = async (req, res) => {
  try {
    const saleId = req.params.id;
    const { items, buyer, saleDate, subtotal, discount, discountAmount, tax, taxAmount, shipping, other, total } = req.body;

    // Find existing sale
    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // First, restore quantities from the original sale
    for (const oldItem of sale.items) {
      if (oldItem.type === 'rto-product') {
        const RTOProduct = require('../models/RTOProduct');
        await RTOProduct.findByIdAndUpdate(oldItem.rtoProduct, { $inc: { quantity: oldItem.quantity } });
        const rtoProduct = await RTOProduct.findById(oldItem.rtoProduct).populate('product');
        if (rtoProduct && rtoProduct.product) {
          await Product.findByIdAndUpdate(rtoProduct.product._id, { $inc: { quantity: oldItem.quantity } });
        }
      } else if (oldItem.type === 'combo') {
        const combo = await Combo.findById(oldItem.combo).populate('products.product');
        if (combo) {
          for (const comboProduct of combo.products) {
            const restoreQty = comboProduct.quantity * oldItem.quantity;
            await Product.findByIdAndUpdate(comboProduct.product._id, { $inc: { quantity: restoreQty } });
          }
        }
      } else {
        await Product.findByIdAndUpdate(oldItem.product, { $inc: { quantity: oldItem.quantity } });

        // Also restore RTO quantity if this product exists in RTO
        const RTOProduct = require('../models/RTOProduct');
        const rtoProducts = await RTOProduct.find({
          product: oldItem.product
        }).sort({ dateAdded: -1 }); // LIFO for restoration

        let remainingQtyToRestore = oldItem.quantity;
        for (const rtoProduct of rtoProducts) {
          if (remainingQtyToRestore > 0) {
            const restoreQty = Math.min(remainingQtyToRestore, oldItem.quantity);
            await RTOProduct.findByIdAndUpdate(rtoProduct._id, { $inc: { quantity: restoreQty } });
            remainingQtyToRestore -= restoreQty;
          }
        }
      }
    }

    // Now process new items and deduct quantities
    const saleItems = [];
    let totalAmount = 0;

    for (const item of items) {
      if (item.type === 'rto-product') {
        const RTOProduct = require('../models/RTOProduct');
        const rtoProduct = await RTOProduct.findById(item.rtoProduct).populate('product');
        if (!rtoProduct) {
          return res.status(400).json({ message: `RTO Product with id ${item.rtoProduct} not found` });
        }

        if (rtoProduct.quantity < item.quantity) {
          return res.status(400).json({ message: `RTO Product ${rtoProduct.productName} does not have enough stock` });
        }

        await RTOProduct.findByIdAndUpdate(rtoProduct._id, { $inc: { quantity: -item.quantity } });
        if (rtoProduct.product) {
          await Product.findByIdAndUpdate(rtoProduct.product._id, { $inc: { quantity: -item.quantity } });
        }

        const itemTotal = rtoProduct.price * item.quantity;
        totalAmount += itemTotal;
        saleItems.push({
          type: 'rto-product',
          rtoProduct: rtoProduct._id,
          productName: rtoProduct.productName,
          quantity: item.quantity,
          unitPrice: rtoProduct.price,
          total: itemTotal,
          barcode: rtoProduct.barcode
        });
      } else if (item.type === 'combo') {
        const combo = await Combo.findById(item.combo).populate('products.product');
        if (!combo) {
          return res.status(400).json({ message: `Combo with id ${item.combo} not found` });
        }

        for (const comboProduct of combo.products) {
          const requiredQty = comboProduct.quantity * item.quantity;
          if (comboProduct.product.quantity < requiredQty) {
            return res.status(400).json({ message: `Product ${comboProduct.product.name} in combo does not have enough stock` });
          }
          await Product.findByIdAndUpdate(comboProduct.product._id, { $inc: { quantity: -requiredQty } });
        }

        const itemTotal = combo.price * item.quantity;
        totalAmount += itemTotal;
        saleItems.push({
          type: 'combo',
          combo: combo._id,
          comboName: combo.name,
          quantity: item.quantity,
          unitPrice: combo.price,
          total: itemTotal,
          barcode: combo.barcode
        });
      } else {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({ message: `Product with id ${item.product} not found` });
        }

        if (product.quantity < item.quantity) {
          return res.status(400).json({ message: `Product ${product.name} does not have enough stock` });
        }

        await Product.findByIdAndUpdate(product._id, { $inc: { quantity: -item.quantity } });

        // Also reduce RTO quantity if this product exists in RTO
        const RTOProduct = require('../models/RTOProduct');
        let remainingQtyToReduce = item.quantity;
        const rtoProducts = await RTOProduct.find({
          product: product._id,
          quantity: { $gt: 0 }
        }).sort({ dateAdded: 1 }); // FIFO - oldest first

        for (const rtoProduct of rtoProducts) {
          if (rtoProduct.quantity > 0 && remainingQtyToReduce > 0) {
            const reduceQty = Math.min(rtoProduct.quantity, remainingQtyToReduce);
            await RTOProduct.findByIdAndUpdate(rtoProduct._id, { $inc: { quantity: -reduceQty } });
            remainingQtyToReduce -= reduceQty;
          }
        }

        const itemTotal = (item.unitPrice || product.price || product.sellingPrice || 0) * item.quantity;
        totalAmount += itemTotal;
        saleItems.push({
          type: 'product',
          product: product._id,
          quantity: item.quantity,
          unitPrice: item.unitPrice || product.price || product.sellingPrice || 0,
          total: itemTotal,
          barcode: product.barcode
        });
      }
    }

    // Update sale fields
    sale.buyer = buyer;
    sale.items = saleItems;
    sale.subtotal = subtotal || totalAmount;
    sale.discount = discount || 0;
    sale.discountAmount = discountAmount || 0;
    sale.tax = tax || 0;
    sale.taxAmount = taxAmount || 0;
    sale.shipping = shipping || 0;
    sale.other = other || 0;
    sale.totalAmount = total || totalAmount;
    sale.saleDate = saleDate || new Date();

    await sale.save();
    const populatedSale = await Sale.findById(sale._id)
      .populate('buyer', 'name phone')
      .populate('items.product', 'name category barcode')
      .populate({
        path: 'items.combo',
        select: 'name description barcode price products',
        populate: {
          path: 'products.product',
          select: 'name barcode price'
        }
      });
    emitEvent('sales:changed', { action: 'updated', id: populatedSale._id });
    emitEvent('inventory:changed', { action: 'sale-updated', id: populatedSale._id });
    res.json(populatedSale);
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
};

// Delete sale
exports.deleteSale = async (req, res) => {
  try {
    const saleId = req.params.id;
    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Restore quantities for each item in sale
    for (const item of sale.items) {
      if (item.type === 'rto-product') {
        // Restore RTO product quantity
        const RTOProduct = require('../models/RTOProduct');
        await RTOProduct.findByIdAndUpdate(item.rtoProduct, { $inc: { quantity: item.quantity } });

        // Also restore original product quantity if it exists
        const rtoProduct = await RTOProduct.findById(item.rtoProduct).populate('product');
        if (rtoProduct && rtoProduct.product) {
          await Product.findByIdAndUpdate(rtoProduct.product._id, { $inc: { quantity: item.quantity } });
        }
      } else if (item.type === 'combo') {
        // Restore combo product quantities
        const combo = await Combo.findById(item.combo).populate('products.product');
        if (combo) {
          for (const comboProduct of combo.products) {
            const restoreQty = comboProduct.quantity * item.quantity;
            await Product.findByIdAndUpdate(comboProduct.product._id, { $inc: { quantity: restoreQty } });
          }
        }
      } else {
        // Restore regular product quantity
        await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });

        // Also restore RTO quantity if this product exists in RTO
        const RTOProduct = require('../models/RTOProduct');
        const rtoProducts = await RTOProduct.find({
          product: item.product
        }).sort({ dateAdded: -1 }); // LIFO for restoration

        let remainingQtyToRestore = item.quantity;
        for (const rtoProduct of rtoProducts) {
          if (remainingQtyToRestore > 0) {
            const restoreQty = Math.min(remainingQtyToRestore, item.quantity);
            await RTOProduct.findByIdAndUpdate(rtoProduct._id, { $inc: { quantity: restoreQty } });
            remainingQtyToRestore -= restoreQty;
          }
        }
      }
    }

    await Sale.findByIdAndDelete(saleId);
    emitEvent('sales:changed', { action: 'deleted', id: saleId });
    emitEvent('inventory:changed', { action: 'sale-deleted', id: saleId });
    res.json({ message: 'Sale deleted and product quantities restored' });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
};
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Combo = require('../models/Combo');
const { emitEvent } = require('../utils/socket');

// Get all sales
exports.getAllSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('buyer', 'name phone')
      .populate('items.product', 'name category')
      .populate({
        path: 'items.combo',
        select: 'name description barcode price products',
        populate: {
          path: 'products.product',
          select: 'name barcode price'
        }
      })
      .sort({ saleDate: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get sale by ID
exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('buyer', 'name phone email address')
      .populate('items.product', 'name description category barcode')
      .populate({
        path: 'items.combo',
        select: 'name description barcode price products',
        populate: {
          path: 'products.product',
          select: 'name barcode price'
        }
      });
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new sale
exports.createSale = async (req, res) => {
  try {
    const {
      buyer,
      items,
      saleDate,
      subtotal,
      discount,
      discountAmount,
      tax,
      taxAmount,
      shipping,
      other,
      total
    } = req.body;

    // Process all items to handle both products and combos
    const productDeductions = new Map(); // Track total deductions per product
    const saleItems = [];
    let totalAmount = 0;

    for (const item of items) {
      if (item.type === 'rto-product') {
        // Handle RTO product item
        const RTOProduct = require('../models/RTOProduct');
        const rtoProduct = await RTOProduct.findById(item.rtoProduct).populate('product');
        if (!rtoProduct) {
          return res.status(400).json({ message: `RTO Product with id ${item.rtoProduct} not found` });
        }

        const requiredQty = item.quantity || 1;
        if (rtoProduct.quantity < requiredQty) {
          return res.status(400).json({
            message: `RTO Product ${rtoProduct.productName} does not have enough stock. Required: ${requiredQty}, Available: ${rtoProduct.quantity}`
          });
        }

        // Also check if the original product has enough stock
        if (rtoProduct.product && rtoProduct.product.quantity < requiredQty) {
          return res.status(400).json({
            message: `Original product ${rtoProduct.product.name} does not have enough stock. Required: ${requiredQty}, Available: ${rtoProduct.product.quantity}`
          });
        }

        const itemTotal = rtoProduct.price * requiredQty;
        totalAmount += itemTotal;

        saleItems.push({
          type: 'rto-product',
          rtoProduct: rtoProduct._id,
          productName: rtoProduct.productName,
          quantity: requiredQty,
          unitPrice: rtoProduct.price,
          total: itemTotal,
          barcode: rtoProduct.barcode
        });

        // Reduce RTO product quantity
        await RTOProduct.findByIdAndUpdate(rtoProduct._id, { $inc: { quantity: -requiredQty } });

        // Also reduce original product quantity if it exists
        if (rtoProduct.product) {
          await Product.findByIdAndUpdate(rtoProduct.product._id, { $inc: { quantity: -requiredQty } });
        }

      } else if (item.type === 'combo') {
        // Handle combo item
        const combo = await Combo.findById(item.combo).populate('products.product');
        if (!combo) {
          return res.status(400).json({ message: `Combo with id ${item.combo} not found` });
        }

        // Check stock for all combo products
        for (const comboProduct of combo.products) {
          const requiredQty = comboProduct.quantity * (item.quantity || 1);
          const currentDeduction = productDeductions.get(comboProduct.product._id.toString()) || 0;
          const totalRequired = currentDeduction + requiredQty;

          if (comboProduct.product.quantity < totalRequired) {
            return res.status(400).json({
              message: `Product ${comboProduct.product.name} in combo ${combo.name} does not have enough stock. Required: ${totalRequired}, Available: ${comboProduct.product.quantity}`
            });
          }

          // Track the deduction
          productDeductions.set(comboProduct.product._id.toString(), totalRequired);
        }

        const itemTotal = combo.price * (item.quantity || 1);
        totalAmount += itemTotal;

        // Add combo as sale item
        saleItems.push({
          type: 'combo',
          combo: combo._id,
          comboName: combo.name,
          quantity: item.quantity || 1,
          unitPrice: combo.price,
          total: itemTotal,
          barcode: combo.barcode
        });

      } else {
        // Handle regular product item
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({ message: `Product with id ${item.product} not found` });
        }

        const requiredQty = item.quantity || 1;
        const currentDeduction = productDeductions.get(product._id.toString()) || 0;
        const totalRequired = currentDeduction + requiredQty;

        if (product.quantity < totalRequired) {
          return res.status(400).json({
            message: `Product ${product.name} does not have enough stock. Required: ${totalRequired}, Available: ${product.quantity}`
          });
        }

        // Track the deduction
        productDeductions.set(product._id.toString(), totalRequired);

        // Also reduce RTO quantity if this product exists in RTO
        const RTOProduct = require('../models/RTOProduct');
        let remainingQtyToReduce = requiredQty;
        const rtoProducts = await RTOProduct.find({
          product: product._id,
          quantity: { $gt: 0 }
        }).sort({ dateAdded: 1 }); // FIFO - oldest first

        for (const rtoProduct of rtoProducts) {
          if (rtoProduct.quantity > 0 && remainingQtyToReduce > 0) {
            const reduceQty = Math.min(rtoProduct.quantity, remainingQtyToReduce);
            await RTOProduct.findByIdAndUpdate(rtoProduct._id, { $inc: { quantity: -reduceQty } });
            remainingQtyToReduce -= reduceQty;
          }
        }

        const itemTotal = (item.unitPrice || product.price) * (item.quantity || 1);
        totalAmount += itemTotal;

        saleItems.push({
          type: 'product',
          product: product._id,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || product.price,
          total: itemTotal,
          barcode: product.barcode
        });
      }
    }

    // Apply all product deductions
    for (const [productId, quantity] of productDeductions.entries()) {
      await Product.findByIdAndUpdate(productId, { $inc: { quantity: -quantity } });
    }

    // Create sale with additional fields
    const sale = new Sale({
      buyer,
      items: saleItems,
      subtotal: subtotal || totalAmount,
      discount: discount || 0,
      discountAmount: discountAmount || 0,
      tax: tax || 0,
      taxAmount: taxAmount || 0,
      shipping: shipping || 0,
      other: other || 0,
      totalAmount: total || totalAmount,
      saleDate: saleDate || new Date()
    });

    const savedSale = await sale.save();

    // Populate the sale differently based on item types
    const populatedSale = await Sale.findById(savedSale._id)
      .populate('buyer', 'name phone')
      .populate({
        path: 'items.product',
        select: 'name category barcode'
      })
      .populate({
        path: 'items.combo',
        select: 'name barcode',
        populate: {
          path: 'products.product',
          select: 'name barcode'
        }
      });

    emitEvent('sales:changed', { action: 'created', id: populatedSale._id });
    emitEvent('inventory:changed', { action: 'sale-created', id: populatedSale._id });
    res.status(201).json(populatedSale);
  } catch (error) {
    console.log(error.message)
    res.status(400).json({ message: error.message });
  }
};

// Scan barcode for sale
exports.scanBarcode = async (req, res) => {
  try {
    const { barcode } = req.body;
    const RTOProduct = require('../models/RTOProduct');

    // First check if this is an RTO product barcode
    const rtoProduct = await RTOProduct.findOne({ barcode }).populate('product');
    if (rtoProduct && rtoProduct.quantity > 0) {
      return res.json({
        type: 'rto-product',
        rtoProduct: {
          _id: rtoProduct._id,
          rtoId: rtoProduct.rtoId,
          productName: rtoProduct.productName,
          barcode: rtoProduct.barcode,
          price: rtoProduct.price,
          quantity: rtoProduct.quantity,
          category: rtoProduct.category,
          product: rtoProduct.product
        },
        price: rtoProduct.price,
        barcode: rtoProduct.barcode,
      });
    }

    // Then try to find a regular product with this barcode
    const product = await Product.findOne({ barcode }).populate('category', 'name code');
    if (product) {
      return res.json({
        type: 'product',
        product: {
          _id: product._id,
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price || product.sellingPrice || 0,
          barcode: product.barcode,
          quantity: product.quantity,
          sellingPrice: product.sellingPrice
        },
        price: product.price || product.sellingPrice || 0,
        barcode: product.barcode,
      });
    }

    // If no product found, try to find a combo with this barcode
    const combo = await Combo.findOne({ barcode, isActive: true })
      .populate('products.product', 'name price barcode quantity');

    if (combo) {
      // Check if all combo products have sufficient stock
      const insufficientStock = [];
      for (const comboProduct of combo.products) {
        if (comboProduct.product.quantity < comboProduct.quantity) {
          insufficientStock.push({
            name: comboProduct.product.name,
            required: comboProduct.quantity,
            available: comboProduct.product.quantity
          });
        }
      }

      if (insufficientStock.length > 0) {
        return res.status(400).json({
          message: 'Insufficient stock for combo items',
          insufficientStock
        });
      }

      return res.json({
        type: 'combo',
        combo: {
          _id: combo._id,
          name: combo.name,
          description: combo.description,
          price: combo.price,
          barcode: combo.barcode,
          products: combo.products.map(cp => ({
            product: cp.product,
            quantity: cp.quantity
          }))
        },
        price: combo.price,
        barcode: combo.barcode,
      });
    }

    return res.status(404).json({ message: 'Product or combo not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};