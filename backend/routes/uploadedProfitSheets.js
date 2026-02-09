const express = require('express');
const router = express.Router();
const UploadedProfitSheet = require('../models/UploadedProfitSheet');
const { emitEvent } = require('../utils/socket');

// GET summary statistics (MUST come before /:id to avoid matching as ID)
router.get('/stats/summary', async (req, res) => {
  try {
    const totalUploads = await UploadedProfitSheet.countDocuments();
    const totalRecords = await UploadedProfitSheet.aggregate([
      { $group: { _id: null, total: { $sum: '$totalRecords' } } }
    ]);

    const profitSummary = await UploadedProfitSheet.aggregate([
      {
        $group: {
          _id: null,
          totalProfit: { $sum: '$profitSummary.totalProfit' },
          deliveredProfit: { $sum: '$profitSummary.deliveredProfit' },
          rtoProfit: { $sum: '$profitSummary.rtoProfit' },
          rpuProfit: { $sum: '$profitSummary.rpuProfit' },
          netProfit: { $sum: '$profitSummary.netProfit' }
        }
      }
    ]);

    const statusSummary = await UploadedProfitSheet.aggregate([
      {
        $group: {
          _id: null,
          deliveredCount: { $sum: '$statusSummary.delivered.count' },
          deliveredProfit: { $sum: '$statusSummary.delivered.profit' },
          rpuCount: { $sum: '$statusSummary.rpu.count' },
          rpuProfit: { $sum: '$statusSummary.rpu.profit' },
          rtoCount: { $sum: '$statusSummary.rto.count' },
          rtoProfit: { $sum: '$statusSummary.rto.profit' }
        }
      }
    ]);

    const statusData = statusSummary[0] || {};

    res.json({
      totalUploads,
      totalRecords: totalRecords[0]?.total || 0,
      profitSummary: profitSummary[0] || {
        totalProfit: 0,
        deliveredProfit: 0,
        rtoProfit: 0,
        rpuProfit: 0,
        netProfit: 0
      },
      statusSummary: {
        delivered: {
          count: statusData.deliveredCount || 0,
          profit: statusData.deliveredProfit || 0
        },
        rpu: {
          count: statusData.rpuCount || 0,
          profit: statusData.rpuProfit || 0
        },
        rto: {
          count: statusData.rtoCount || 0,
          profit: statusData.rtoProfit || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET all uploaded profit sheets
router.get('/', async (req, res) => {
  try {
    const { status, search, startDate, endDate } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.fileName = { $regex: search, $options: 'i' };
    }

    // Date range filter
    if (startDate || endDate) {
      filter.uploadDate = {};
      if (startDate) {
        filter.uploadDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.uploadDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      }
    }

    const sheets = await UploadedProfitSheet.find(filter)
      .sort({ uploadDate: -1 });

    res.json(sheets);
  } catch (error) {
    console.error('Error fetching uploaded sheets:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET single uploaded profit sheet details
router.get('/:id', async (req, res) => {
  try {
    const sheet = await UploadedProfitSheet.findById(req.params.id);

    if (!sheet) {
      return res.status(404).json({ message: 'Uploaded profit sheet not found' });
    }

    res.json(sheet);
  } catch (error) {
    console.error('Error fetching sheet:', error);
    res.status(500).json({ message: error.message });
  }
});

// CREATE new uploaded profit sheet
router.post('/', async (req, res) => {
  try {
    const {
      fileName,
      totalRecords,
      successRecords,
      errorRecords,
      profitSummary,
      uploadedData,
      notes
    } = req.body;

    if (!fileName || !uploadedData) {
      return res.status(400).json({ message: 'File name and uploaded data are required' });
    }

    const computedSummary = computeProfitSummary(uploadedData);

    const sheet = new UploadedProfitSheet({
      fileName,
      totalRecords: totalRecords || uploadedData.length,
      successRecords: successRecords || uploadedData.length,
      errorRecords: errorRecords || 0,
      profitSummary: profitSummary || computedSummary,
      paymentSummary: computedSummary.paymentSummary,
      statusSummary: computedSummary.statusSummary,
      uploadedData,
      notes,
      deductions: [],
      netProfitAfterDeductions: (computedSummary.deliveredProfit - computedSummary.rpuProfit) // Initial calculation
    });

    await sheet.save();

    emitEvent('uploaded-profit-sheets:changed', { action: 'created', id: sheet._id });
    res.status(201).json(sheet);
    console.log('📥 Created UploadedProfitSheet:', { id: sheet._id, fileName: sheet.fileName, totalRecords: sheet.totalRecords, uploadedDataLength: sheet.uploadedData.length });
    if (sheet.uploadedData.length > 0) console.log('📥 First uploaded row in created sheet:', sheet.uploadedData[0]);
  } catch (error) {
    console.error('Error creating uploaded sheet:', error);
    res.status(500).json({ message: error.message });
  }
});

// UPDATE uploaded profit sheet
router.put('/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;

    const sheet = await UploadedProfitSheet.findById(req.params.id);
    if (!sheet) {
      return res.status(404).json({ message: 'Uploaded profit sheet not found' });
    }

    if (status) sheet.status = status;
    if (notes !== undefined) sheet.notes = notes;

    await sheet.save();

    emitEvent('uploaded-profit-sheets:changed', { action: 'updated', id: sheet._id });
    res.json(sheet);
  } catch (error) {
    console.error('Error updating sheet:', error);
    res.status(500).json({ message: error.message });
  }
});

// UPDATE a specific row within a sheet
router.put('/:sheetId/rows/:rowId', async (req, res) => {
  try {
    const { sheetId, rowId } = req.params;
    const updates = req.body || {};

    const sheet = await UploadedProfitSheet.findById(sheetId);
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });

    const row = sheet.uploadedData.id(rowId);
    if (!row) return res.status(404).json({ message: 'Row not found' });

    // Apply updates to row
    Object.keys(updates).forEach(k => {
      if (k in row) row[k] = updates[k];
    });

    // Recompute summary
    const summary = computeProfitSummary(sheet.uploadedData);
    sheet.profitSummary = summary;
    sheet.paymentSummary = summary.paymentSummary;
    sheet.statusSummary = summary.statusSummary;
    sheet.totalRecords = sheet.uploadedData.length;
    sheet.successRecords = sheet.uploadedData.filter(r => r.orderId && r.orderId.trim() !== '').length;
    sheet.errorRecords = sheet.totalRecords - sheet.successRecords;

    await sheet.save();

    emitEvent('uploaded-profit-sheets:changed', { action: 'row-updated', id: sheet._id, rowId });
    res.json(sheet);
  } catch (error) {
    console.error('Error updating row:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE a row from a sheet
router.delete('/:sheetId/rows/:rowId', async (req, res) => {
  try {
    const { sheetId, rowId } = req.params;
    const sheet = await UploadedProfitSheet.findById(sheetId);
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });

    const row = sheet.uploadedData.id(rowId);
    if (!row) return res.status(404).json({ message: 'Row not found' });

    row.remove();

    // Recompute summary
    const summary = computeProfitSummary(sheet.uploadedData);
    sheet.profitSummary = summary;
    sheet.paymentSummary = summary.paymentSummary;
    sheet.statusSummary = summary.statusSummary;
    sheet.totalRecords = sheet.uploadedData.length;
    sheet.successRecords = sheet.uploadedData.filter(r => r.orderId && r.orderId.trim() !== '').length;
    sheet.errorRecords = sheet.totalRecords - sheet.successRecords;

    await sheet.save();
    emitEvent('uploaded-profit-sheets:changed', { action: 'row-deleted', id: sheet._id, rowId });
    res.json(sheet);
  } catch (error) {
    console.error('Error deleting row:', error);
    res.status(500).json({ message: error.message });
  }
});

// CREATE a new row in a sheet
router.post('/:sheetId/rows', async (req, res) => {
  try {
    const { sheetId } = req.params;
    const rowData = req.body || {};
    const sheet = await UploadedProfitSheet.findById(sheetId);
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });

    // Normalize keys if necessary
    const row = {
      month: String(rowData.month || rowData['Month'] || ''),
      sno: String(rowData.sno || rowData['S.No.'] || ''),
      orderDate: String(rowData.orderDate || rowData['Order Date'] || ''),
      orderId: String(rowData.orderId || rowData['Order id'] || ''),
      sku: String(rowData.sku || rowData['SKU'] || ''),
      quantity: String(rowData.quantity || rowData['Quantity'] || ''),
      status: String(rowData.status || rowData['Status'] || ''),
      payment: String(rowData.payment || rowData['Payment'] || ''),
      paymentDate: String(rowData.paymentDate || rowData['Payment Date'] || ''),
      paymentStatus: String(rowData.paymentStatus || rowData['Payment Status'] || ''),
      purchasePrice: String(rowData.purchasePrice || rowData['Purchase Price'] || ''),
      profit: String(rowData.profit || rowData['Profit'] || ''),
      reuseOrClaim: String(rowData.reuseOrClaim || rowData['Re-use / Claim'] || ''),
      reusedDate: String(rowData.reusedDate || rowData['Reused Date'] || ''),
      statusOfProduct: String(rowData.statusOfProduct || rowData['Status of Product'] || ''),
      remarks: String(rowData.remarks || rowData['Remarks'] || ''),
    };

    sheet.uploadedData.push(row);

    // Recompute summary
    updateSheetTotals(sheet);
    sheet.totalRecords = sheet.uploadedData.length;
    sheet.successRecords = sheet.uploadedData.filter(r => r.orderId && r.orderId.trim() !== '').length;
    sheet.errorRecords = sheet.totalRecords - sheet.successRecords;

    await sheet.save();

    emitEvent('uploaded-profit-sheets:changed', { action: 'row-added', id: sheet._id });
    res.status(201).json(sheet);
  } catch (error) {
    console.error('Error adding row:', error);
    res.status(500).json({ message: error.message });
  }
});

// ADD Deduction
router.post('/:id/deductions', async (req, res) => {
  try {
    const { reason, amount } = req.body;
    const sheet = await UploadedProfitSheet.findById(req.params.id);
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });

    sheet.deductions.push({ reason, amount: Number(amount) });
    updateSheetTotals(sheet);
    await sheet.save();

    emitEvent('uploaded-profit-sheets:changed', { action: 'deduction-added', id: sheet._id });
    res.json(sheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE Deduction
router.delete('/:id/deductions/:deductionId', async (req, res) => {
  try {
    const sheet = await UploadedProfitSheet.findById(req.params.id);
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });

    sheet.deductions = sheet.deductions.filter(d => d._id.toString() !== req.params.deductionId);
    updateSheetTotals(sheet);
    await sheet.save();

    emitEvent('uploaded-profit-sheets:changed', { action: 'deduction-deleted', id: sheet._id });
    res.json(sheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function computeProfitSummary(rows) {
  let totalProfit = 0;
  let deliveredProfit = 0;
  let rpuProfit = 0;
  let rtoProfit = 0;

  const statusSummary = {
    delivered: { count: 0, profit: 0 },
    rpu: { count: 0, profit: 0 },
    rto: { count: 0, profit: 0 },
  };

  let totalPayment = 0;
  let deliveredPayment = 0;
  let rpuPayment = 0;
  let rtoPayment = 0;

  rows.forEach(r => {
    const p = Number(r.profit || 0);
    const quantity = Number(r.quantity || 1);

    if (!Number.isNaN(p)) {
      totalProfit += p;

      const statusLower = (r.status || '').toLowerCase().trim();

      if (statusLower === 'rpu' || statusLower === 'returned') {
        rpuProfit += p;
        statusSummary.rpu.count += quantity;
        statusSummary.rpu.profit += p;
      } else if (statusLower === 'rto' || statusLower === 'return to origin') {
        rtoProfit += p;
        statusSummary.rto.count += quantity;
        statusSummary.rto.profit += p;
      } else {
        deliveredProfit += p;
        statusSummary.delivered.count += quantity;
        statusSummary.delivered.profit += p;
      }
    }

    // Payment Calculation
    const paymentStr = String(r.payment || r.Payment || r['Payment Amount'] || '').replace(/[^0-9.-]/g, '');
    const payment = Math.abs(parseFloat(paymentStr) || 0);

    totalPayment += payment;
    const sLower = (r.status || '').toLowerCase().trim();
    if (sLower === 'delivered') {
      deliveredPayment += payment;
    } else if (sLower === 'rpu' || sLower === 'returned') {
      rpuPayment += payment;
    } else if (sLower === 'rto' || sLower === 'return to origin') {
      rtoPayment += payment;
    }
  });

  return {
    totalProfit: Number(totalProfit.toFixed(2)),
    deliveredProfit: Number(deliveredProfit.toFixed(2)),
    rpuProfit: Number(rpuProfit.toFixed(2)),
    rtoProfit: Number(rtoProfit.toFixed(2)),
    netProfit: Number((deliveredProfit + rpuProfit + rtoProfit).toFixed(2)),
    statusSummary: {
      delivered: {
        count: statusSummary.delivered.count,
        profit: Number(statusSummary.delivered.profit.toFixed(2)),
      },
      rpu: {
        count: statusSummary.rpu.count,
        profit: Number(statusSummary.rpu.profit.toFixed(2)),
      },
      rto: {
        count: statusSummary.rto.count,
        profit: Number(statusSummary.rto.profit.toFixed(2)),
      },
    },
    // Note: Deductions are not part of row-level summary, but netProfitAfterDeductions 
    // will be calculated at the sheet level where this function is called.
    paymentSummary: {
      totalPayment: Number(totalPayment.toFixed(2)),
      deliveredPayment: Number(deliveredPayment.toFixed(2)),
      rpuPayment: Number(rpuPayment.toFixed(2)),
      rtoPayment: Number(rtoPayment.toFixed(2))
    }
  };
}

// Helper to recalculate sheet totals including deductions
function updateSheetTotals(sheet) {
  const summary = computeProfitSummary(sheet.uploadedData);
  sheet.profitSummary = summary;
  sheet.paymentSummary = summary.paymentSummary;
  sheet.statusSummary = summary.statusSummary;

  const totalDeductions = sheet.deductions.reduce((sum, d) => sum + (d.amount || 0), 0);

  // Profit formula: (Delivered Payment - RPU Payment) - Deductions
  // Note: profitSummary.deliveredProfit is sum of profits of delivered items.
  // The user request says: "value of (delivered-rpu)" which usually implies payments or profits.
  // Assuming they mean the Profit values calculated from the sheet.
  // If they mean the Payment values, we need to sum payments. 
  // Looking at the frontend, it uses Payments for the cards.
  // Ideally we should store payment sums in the summary too, but for now let's stick to what we have 
  // or add payment sums if needed. 
  // However, the previous summary had "deliveredProfit", "rpuProfit". 
  // Let's use the explicit request: (Delivered - RPU).

  // Let's rely on the frontend to calculate the display value if it uses payments, 
  // OR update the backend to support payment summaries. 
  // The current backend `computeProfitSummary` sums PROFIT, not PAYMENT. 
  // But the FRONTEND `calculateAllUploadTotals` sums PAYMENTS.
  // To be safe and consistent with backend data, let's persist what we can.

  // For the purpose of `netProfitAfterDeductions` on the backend, let's keep it simple:
  // We'll just update the field, and let the frontend decide how to display "Profit" (Delivered - RPU - Deductions).
  // But strictly speaking, if we want to store it, we need to know if we are using Profit or Payment.
  // The user said "instead of RTO give as profit and display the value of (delivered-rpu)".

  sheet.netProfitAfterDeductions = (sheet.profitSummary.deliveredProfit - sheet.profitSummary.rpuProfit) - totalDeductions;

  return sheet;
}

// DELETE uploaded profit sheet
router.delete('/:id', async (req, res) => {
  try {
    const sheet = await UploadedProfitSheet.findByIdAndDelete(req.params.id);

    if (!sheet) {
      return res.status(404).json({ message: 'Uploaded profit sheet not found' });
    }

    emitEvent('uploaded-profit-sheets:changed', { action: 'deleted', id: req.params.id });
    res.json({ message: 'Uploaded profit sheet deleted successfully' });
  } catch (error) {
    console.error('Error deleting sheet:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;