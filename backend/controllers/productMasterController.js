const Category = require('../models/Category');
const Combo = require('../models/Combo');
const Product = require('../models/Product');
const xlsx = require('xlsx');
const { emitEvent } = require('../utils/socket');

// Upload and process Excel file
exports.uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    if (!jsonData || jsonData.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty or invalid' });
    }

    // Process and validate data
    const processedData = [];
    const errors = [];
    const categoriesCreated = [];
    const combosCreated = [];
    const combosUpdated = [];
    
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      try {
        // Map Excel columns to schema fields (flexible matching)
        const sNo = Object.values(row)[0]; // First column
        const productCategory = Object.values(row)[1]; // Second column
        const sellingProductCode = Object.values(row)[2]; // Third column
        const productName = Object.values(row)[3]; // Fourth column
        const pricePerProduct = Object.values(row)[4]; // Fifth column
        const priceWithGST = Object.values(row)[5]; // Sixth column

        // Skip empty rows
        if (!sNo && !productCategory && !sellingProductCode && !productName && pricePerProduct === undefined) {
          continue;
        }
        
        // Validate required fields - only need data up to Price/product with GST
        if (!sNo || !productCategory || !sellingProductCode || !productName || pricePerProduct === undefined) {
          continue; // Skip invalid rows instead of adding to errors
        }

        const categoryName = String(productCategory).trim();
        const comboCode = String(sellingProductCode).trim();
        const comboName = String(productName).trim();
        const comboPrice = Number(pricePerProduct);

        // Step 1: Find or create category
        let category = await Category.findOne({ name: categoryName });
        
        if (!category) {
          // Generate a unique 3-digit code for the category
          const categoryCount = await Category.countDocuments();
          const categoryCode = String(categoryCount + 1).padStart(3, '0');
          
          category = new Category({
            name: categoryName,
            code: categoryCode,
            description: `Auto-created from Excel upload`
          });
          
          await category.save();
          categoriesCreated.push(category.name);
        }

        // Step 2: Check if selling product code already exists, update if found
        let existingCombo = await Combo.findOne({ barcode: comboCode });
        
        if (existingCombo) {
          // Update existing combo
          existingCombo.name = comboName;
          existingCombo.price = comboPrice;
          existingCombo.category = category._id;
          await existingCombo.save();
          combosUpdated.push(comboCode);
          
          processedData.push({
            sNo: Number(sNo),
            category: categoryName,
            comboCode: comboCode,
            comboName: comboName,
            price: comboPrice,
            priceWithGST: priceWithGST ? Number(priceWithGST) : (comboPrice * 1.18),
            action: 'updated',
            comboId: existingCombo._id
          });
          continue;
        }
        
        // Create new combo - only selling product code matters
        const combo = new Combo({
          name: comboName,
          barcode: comboCode,
          price: comboPrice,
          category: category._id,
          description: `Imported from Excel - Category: ${categoryName}`,
          isActive: true
        });
        
        await combo.save();
        combosCreated.push(comboCode);

        processedData.push({
          sNo: Number(sNo),
          category: categoryName,
          comboCode: comboCode,
          comboName: comboName,
          price: comboPrice,
          priceWithGST: priceWithGST ? Number(priceWithGST) : (comboPrice * 1.18),
          action: 'created',
          comboId: combo._id
        });

      } catch (error) {
        // Skip error rows, don't add to errors array
        continue;
      }
    }

    if (categoriesCreated.length > 0) {
      emitEvent('categories:changed', { action: 'bulk-created' });
    }
    if (combosCreated.length > 0 || combosUpdated.length > 0) {
      emitEvent('combos:changed', { action: 'bulk-updated' });
    }

    res.status(200).json({
      message: 'Excel file processed successfully',
      totalRows: jsonData.length,
      successCount: processedData.length,
      errorCount: errors.length,
      categoriesCreated: categoriesCreated.length,
      combosCreated: combosCreated.length,
      combosUpdated: combosUpdated.length,
      processedData,
      errors,
      summary: {
        categories: categoriesCreated,
        newCombos: combosCreated,
        updatedCombos: combosUpdated
      }
    });
  } catch (error) {
    console.error('Error processing Excel file:', error);
    res.status(500).json({ message: error.message });
  }
};


