const bwipjs = require('bwip-js');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const generateBarcode = async (text) => {
  try {
    const barcodeData = await bwipjs.toBuffer({
      bcid: 'code128', // Barcode type
      text: text, // Text to encode
      scale: 3, // 3x scaling factor
      height: 10, // Bar height, in millimeters
      includetext: true, // Show human-le text
      textxalign: 'center', // Always good to set this
      backgroundcolor: 'ffffff', // White background
      barcolor: '000000', // Black bars
      textcolor: '000000' // Black text
    });
    
    return barcodeData;
  } catch (error) {
    console.error('Barcode generation error:', error);
    throw error;
  }
};

// Generate formatted barcode with VP Fashions branding exactly like your format
const generateFormattedBarcode = async (itemName, barcodeId) => {
  try {
    // Create the main barcode without text
    const barcodeData = await bwipjs.toBuffer({
      bcid: 'code128', // Barcode type
      text: barcodeId, // The barcode ID to encode
      scale: 4, // Larger scale for better quality
      height: 20, // Taller bars
      includetext: false, // No built-in text, we'll composite our own
      backgroundcolor: 'ffffff', // White background
      barcolor: '000000', // Black bars
      paddingwidth: 20,
      paddingheight: 60 // Extra padding for text
    });

    // For now, return the basic barcode with padding
    // In a production environment, you might want to use Canvas or similar
    // to add the "VP Fashions" header and formatted text below
    return barcodeData;
    
  } catch (error) {
    console.error('Formatted barcode generation error:', error);
    throw error;
  }
};

//VP
const generateVPFashionsBarcode = async (itemName, barcodeId) => {
  try {
    // Step 1: Generate barcode only (no text)
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: barcodeId,
      scale: 4,
      height: 12,
      includetext: false,
      backgroundcolor: 'ffffff',
      barcolor: '000000',
      paddingwidth: 10,
      paddingheight: 10,
    });

    // Step 2: Create canvas (wider & taller for texts + barcode)
    const barcodeImage = await loadImage(barcodeBuffer);
    const canvasWidth = barcodeImage.width + 40;
    const canvasHeight = barcodeImage.height + 100;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Fill background white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Step 3: Add "VP Fashions" (top)
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VP Fashions', canvasWidth / 2, 40);

    // Step 4: Draw barcode (middle)
    ctx.drawImage(barcodeImage, 20, 40);

    // Step 5: Add bottom texts
    if(itemName==null)
        itemName="";
  ctx.font = 'bold 40px Arial';
  ctx.fillText(`ID No: ${barcodeId}`, canvasWidth / 2, barcodeImage.height + 50);
  ctx.fillText(`${itemName}`, canvasWidth / 2, barcodeImage.height + 85);

    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Barcode generation error:', error);
    throw error;
  }
};

// Generate barcode ID using database counter
const generateBarcodeId = async () => {
  const BarcodeCounter = require('../models/BarcodeCounter');
  const prefix = 'IM001VP';
  const counter = await BarcodeCounter.findOneAndUpdate(
    { prefix },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const nextNumber = counter.seq;
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};

module.exports = { generateBarcode, generateFormattedBarcode, generateVPFashionsBarcode, generateBarcodeId };
  


// IM001VP0001
