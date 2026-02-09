const PDFDocument = require('pdfkit');
const fs = require('fs');

// Generate purchase invoice PDF
exports.generatePurchaseInvoice = async (purchase) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      let buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Add content to PDF
      doc.fontSize(20).text('Purchase Invoice', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12).text(`Invoice ID: ${purchase.purchaseId}`);
      doc.text(`Date: ${purchase.purchaseDate.toDateString()}`);
      doc.text(`Vendor: ${purchase.vendor.name}`);
      doc.text(`Contact: ${purchase.vendor.contactPerson}`);
      doc.moveDown();
      
      // Table header
      doc.text('Item', 50, doc.y);
      doc.text('Qty', 250, doc.y);
      doc.text('Unit Price', 300, doc.y);
      doc.text('Total', 400, doc.y);
      doc.moveTo(50, doc.y + 5).lineTo(450, doc.y + 5).stroke();
      doc.moveDown();
      
      // Table rows
      purchase.items.forEach(item => {
        doc.text(item.product.name, 50, doc.y);
        doc.text(item.quantity.toString(), 250, doc.y);
        doc.text(`$${item.unitCost.toFixed(2)}`, 300, doc.y);
        doc.text(`$${item.total.toFixed(2)}`, 400, doc.y);
        doc.moveDown();
      });
      
      doc.moveTo(50, doc.y + 5).lineTo(450, doc.y + 5).stroke();
      doc.moveDown();
      
      doc.text(`Total Amount: $${purchase.totalAmount.toFixed(2)}`, 300, doc.y, { align: 'right' });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate sale invoice PDF
exports.generateSaleInvoice = async (sale) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      let buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Add content to PDF
      doc.fontSize(20).text('Sale Invoice', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12).text(`Invoice ID: ${sale.saleId}`);
      doc.text(`Date: ${sale.saleDate.toDateString()}`);
      doc.text(`Customer: ${sale.buyer.name}`);
      doc.text(`Contact: ${sale.buyer.phone}`);
      doc.moveDown();
      
      // Table header
      doc.text('Item', 50, doc.y);
      doc.text('Barcode', 200, doc.y);
      doc.text('Price', 350, doc.y);
      doc.moveTo(50, doc.y + 5).lineTo(450, doc.y + 5).stroke();
      doc.moveDown();
      // Table rows
      sale.items.forEach(item => {
        doc.text(item.product.name, 50, doc.y);
        doc.text(item.product.barcode, 200, doc.y);
        doc.text(`$${item.unitPrice.toFixed(2)}`, 350, doc.y);
        doc.moveDown();
      });
      
      doc.moveTo(50, doc.y + 5).lineTo(450, doc.y + 5).stroke();
      doc.moveDown();
      
      doc.text(`Total Amount: $${sale.totalAmount.toFixed(2)}`, 300, doc.y, { align: 'right' });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};