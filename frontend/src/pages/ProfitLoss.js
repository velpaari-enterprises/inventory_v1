import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton
} from '@mui/material';
import { profitLossAPI, uploadedProfitSheetsAPI, salesAPI } from '../services/api';
import { socket } from '../services/socket';
import { FaUpload, FaDownload, FaChartLine, FaCheck, FaTimes, FaFileExcel, FaFilePdf } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

// Theme Colors - Premium Gold & Black
const THEME = {
  gold: '#D4AF37',
  richGold: '#C9A227',
  softGold: '#E2C878',
  lightGold: '#F4E3B2',
  black: '#000000',
  charcoal: '#1A1A1A',
  softCharcoal: '#2C2C2C',
  white: '#FFFFFF',
  offWhite: '#F8F5F0'
};

const ProfitLoss = () => {
  const formatCurrency = (value, showZero = true) => {
    const num = value == null || value === '' ? null : Number(value);
    if (num == null || Number.isNaN(num)) return showZero ? '₹0.00' : '-';
    return `₹${num.toFixed(2)}`;
  };

  const formatNumberForExcel = (value) => {
    const num = value == null || value === '' ? 0 : Number(value);
    return Number.isNaN(num) ? 0 : num;
  };

  // Calculate totals from upload results
  const calculateUploadTotals = (results) => {
    if (!results || results.length === 0) return null;

    let totalProducts = 0;
    let deliveredAmount = 0;
    let deliveredCount = 0;
    let rpuAmount = 0;
    let rpuCount = 0;
    let rtoAmount = 0;
    let rtoCount = 0;
    let deliveredPayment = 0;
    let rpuPayment = 0;
    let rtoPayment = 0;
    let totalPayment = 0;
    let totalProfit = 0;

    if (results.length > 0) {
      console.log('First item:', results[0]);
      console.log('Keys:', Object.keys(results[0]));
    }

    results.forEach(item => {
      const quantity = Number(item.Quantity || item.quantity || 1);
      // CAUTION: Strictly use 'Profit' column for amount calculation as per requirement
      // Clean the profit string similar to backend
      const rawProfit = item.Profit || item.profit || 0;
      const profitStr = String(rawProfit).replace(/[^0-9.-]/g, '');
      const profit = parseFloat(profitStr) || 0;

      // Parse Payment column and convert to numeric
      const rawPayment = item.Payment || item.payment || 0;
      const paymentStr = String(rawPayment).replace(/[^0-9.-]/g, '');
      const payment = parseFloat(paymentStr) || 0;

      const status = (item.Status || item.status || '').toLowerCase().trim();

      totalProducts += quantity;

      if (status === 'delivered' || status === 'delivery') {
        deliveredAmount += profit;
        deliveredCount += quantity;
        deliveredPayment += payment;
      } else if (status === 'rpu' || status === 'returned' || status === 'rpo') {
        rpuAmount += profit;
        rpuCount += quantity;
        rpuPayment += payment;
      } else if (status === 'rto' || status === 'return to origin') {
        rtoAmount += profit;
        rtoCount += quantity;
        rtoPayment += payment;
      }
      totalPayment += payment;
      totalProfit += profit;
    });

    return {
      totalProducts,
      deliveredAmount,
      deliveredCount,
      rpuAmount,
      rpuCount,
      rtoAmount,
      rtoCount,
      // new payment sums
      deliveredPayment,
      rpuPayment,
      rtoPayment,
      totalPayment,
      // totals for backward compatibility
      totalProfit
    };
  };
  const [filter, setFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [profitData, setProfitData] = useState([]);
  const [editingProfitRow, setEditingProfitRow] = useState(null);
  const [showEditProfitModal, setShowEditProfitModal] = useState(false);
  const [monthlyData, setMonthlyData] = useState([]);
  const [uploadResults, setUploadResults] = useState([]);
  const [uploadedSheet, setUploadedSheet] = useState(null);
  const [availableSheets, setAvailableSheets] = useState([]);
  const [selectedSheetId, setSelectedSheetId] = useState(null);
  const [showAllUploads, setShowAllUploads] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);



  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const fetchProfitLoss = useCallback(async () => {
    // Validation
    if (!filter.startDate || !filter.endDate) {
      setError('Please select both Start Date and End Date');
      return;
    }

    if (new Date(filter.startDate) > new Date(filter.endDate)) {
      setError('Start Date must be before End Date');
      return;
    }

    setLoading(true);
    try {
      const response = await profitLossAPI.getProfitLoss(filter.startDate, filter.endDate);
      setProfitData(response.data.profitData || []);
      setMonthlyData(response.data.monthlyChartData || []);
      setSummary(response.data.summary || null);
      // Fetch uploaded sheets and filter them
      fetchUploadedData(filter.startDate, filter.endDate);
      setError('');
    } catch (error) {
      setError('Failed to fetch profit/loss data: ' + error.message);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [filter.startDate, filter.endDate]);

  const fetchUploadedData = useCallback(async (startDate, endDate) => {
    try {
      const response = await profitLossAPI.getUploadedData();
      const sheets = response.data.results || [];
      setAvailableSheets(sheets);

      // If no sheet is selected yet, select the latest
      if (!selectedSheetId && sheets.length > 0) {
        setSelectedSheetId(sheets[0]._id);
        setUploadedSheet(sheets[0]);
        setUploadResults(filterRowsByDate(sheets[0].uploadedData || [], startDate, endDate));
      } else if (selectedSheetId) {
        const sel = sheets.find(s => s._id === selectedSheetId);
        if (sel) {
          setUploadedSheet(sel);
          setUploadResults(filterRowsByDate(sel.uploadedData || [], startDate, endDate));
        }
      } else if (showAllUploads) {
        // flatten all rows from all sheets
        const allRows = sheets.reduce((acc, s) => acc.concat(s.uploadedData || []), []);
        setUploadResults(filterRowsByDate(allRows, startDate, endDate));
      }
    } catch (err) {
      console.error('Failed to fetch uploaded data:', err);
    }
  }, [selectedSheetId, showAllUploads]);

  useEffect(() => {
    const handleUploadsChange = () => {
      fetchUploadedData(filter.startDate, filter.endDate);
    };

    const handleSalesChange = () => {
      if (filter.startDate && filter.endDate) {
        fetchProfitLoss();
      }
    };

    socket.on('uploaded-profit-sheets:changed', handleUploadsChange);
    socket.on('sales:changed', handleSalesChange);

    return () => {
      socket.off('uploaded-profit-sheets:changed', handleUploadsChange);
      socket.off('sales:changed', handleSalesChange);
    };
  }, [fetchUploadedData, fetchProfitLoss, filter.startDate, filter.endDate]);

  const filterRowsByDate = (rows, startDate, endDate) => {
    if (!startDate && !endDate) return rows;
    return (rows || []).filter((r) => {
      const dateStr = r.orderDate || r['Order Date'] || r.date || r.paymentDate;
      const d = dateStr ? new Date(dateStr) : null;
      if (!d || Number.isNaN(d.valueOf())) return false;
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(new Date(endDate).setHours(23, 59, 59, 999))) return false;
      return true;
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);

    setLoading(true);
    try {
      console.log('Starting upload...');
      const response = await profitLossAPI.uploadExcel(file);
      console.log('Upload response:', response.data);
      // Handle both legacy array response and new sheet doc response
      let savedResults = response.data.results || [];
      // If the server returned a saved sheet document, extract uploadedData and track the sheet
      if (savedResults && !Array.isArray(savedResults)) {
        setUploadedSheet(savedResults);
        savedResults = savedResults.uploadedData || [];
      } else {
        setUploadedSheet(null);
      }
      if (savedResults && !Array.isArray(savedResults)) {
        // assume it's a sheet doc with uploadedData
        savedResults = savedResults.uploadedData || [];
      }
      console.log('Results array:', savedResults);
      if (savedResults && savedResults.length > 0) {
        console.log('First result:', savedResults[0]);
        console.log('All keys in first result:', Object.keys(savedResults[0]));
      }
      setUploadResults(savedResults || []);
      setSummary(response.data.summary || null);
      // setShowModal(true); // User requested to remove this popup
      setError('');
      e.target.value = '';

    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload file: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // ProfitData row edit handlers
  const handleEditProfitRowClick = async (row) => {
    // row contains saleId and itemId
    try {
      setLoading(true);
      const resp = await salesAPI.getById(row.saleId);
      const sale = resp.data;
      // find item by itemId
      const item = sale.items.find(i => String(i._id) === String(row.itemId) || String(i._id) === String(row.itemId));
      setEditingProfitRow({ sale, item });
      setShowEditProfitModal(true);
    } catch (err) {
      console.error('Failed to fetch sale for editing:', err);
      setError('Failed to fetch sale for editing: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfitRowChange = (key, value) => {
    setEditingProfitRow(prev => ({
      ...prev,
      item: { ...prev.item, [key]: value }
    }));
  };

  const saveEditedProfitRow = async () => {
    if (!editingProfitRow || !editingProfitRow.sale) return setError('Missing sale to update');
    try {
      setLoading(true);
      const sale = editingProfitRow.sale;
      const updatedItems = sale.items.map(i => {
        if (String(i._id) === String(editingProfitRow.item._id)) {
          return {
            ...i,
            quantity: editingProfitRow.item.quantity,
            unitPrice: editingProfitRow.item.unitPrice,
          };
        }
        return i;
      });

      const payload = {
        items: updatedItems,
        buyer: sale.buyer?._id || sale.buyer || '',
        saleDate: sale.saleDate,
        subtotal: sale.subtotal,
        discount: sale.discount,
        discountAmount: sale.discountAmount,
        tax: sale.tax,
        taxAmount: sale.taxAmount,
        shipping: sale.shipping,
        other: sale.other,
        total: sale.totalAmount,
      };

      await salesAPI.update(sale._id, payload);
      setShowEditProfitModal(false);
      // Refresh profit/loss data
      if (filter.startDate && filter.endDate) {
        fetchProfitLoss();
      }
      setError('');
    } catch (err) {
      console.error('Failed to save edited sale item:', err);
      setError('Failed to save edited sale item: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const deleteProfitRow = async (row) => {
    // Remove item from sale and call update
    try {
      setLoading(true);
      const resp = await salesAPI.getById(row.saleId);
      const sale = resp.data;
      const updatedItems = sale.items.filter(i => String(i._id) !== String(row.itemId));
      // If no items left, delete the sale
      if (updatedItems.length === 0) {
        await salesAPI.delete(sale._id);
      } else {
        const payload = {
          items: updatedItems,
          buyer: sale.buyer?._id || sale.buyer || '',
          saleDate: sale.saleDate,
          subtotal: sale.subtotal,
          discount: sale.discount,
          discountAmount: sale.discountAmount,
          tax: sale.tax,
          taxAmount: sale.taxAmount,
          shipping: sale.shipping,
          other: sale.other,
          total: sale.totalAmount,
        };
        await salesAPI.update(sale._id, payload);
      }
      if (filter.startDate && filter.endDate) fetchProfitLoss();
    } catch (err) {
      console.error('Failed to delete sale item:', err);
      setError('Failed to delete sale item: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (row) => {
    setEditingRow(row);
    setShowEditModal(true);
  };

  const handleEditChange = (key, value) => {
    setEditingRow(prev => ({ ...prev, [key]: value }));
  };

  const saveEditedRow = async () => {
    if (!uploadedSheet) {
      setError('No uploaded sheet selected for editing');
      return;
    }
    try {
      setLoading(true);
      const response = await uploadedProfitSheetsAPI.updateRow(uploadedSheet._id, editingRow._id || editingRow.id, editingRow);
      const updatedSheet = response.data;
      setUploadedSheet(updatedSheet);
      setUploadResults(updatedSheet.uploadedData || []);
      setShowEditModal(false);
      setError('');
      // refresh lists
      fetchUploadedData(filter.startDate, filter.endDate);
    } catch (err) {
      console.error('Edit row failed:', err);
      setError('Failed to save changes: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const deleteRow = async (rowId) => {
    if (!uploadedSheet) {
      setError('No uploaded sheet selected');
      return;
    }
    if (!confirm('Are you sure you want to delete this row?')) return;

    try {
      setLoading(true);
      const response = await uploadedProfitSheetsAPI.deleteRow(uploadedSheet._id, rowId);
      const updatedSheet = response.data;
      setUploadedSheet(updatedSheet);
      setUploadResults(updatedSheet.uploadedData || []);
      setError('');
    } catch (err) {
      console.error('Delete row failed:', err);
      setError('Failed to delete row: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilter({
      startDate: '',
      endDate: ''
    });
    setProfitData([]);
    setMonthlyData([]);
    setSummary(null);
  };

  // fetch saved uploads when component mounts
  useEffect(() => {
    fetchUploadedData();
  }, []);

  // Compute upload totals (payments & profit) from uploaded rows for rendering
  const uploadTotals = calculateUploadTotals(uploadResults) || {};

  const handleSelectSheet = (e) => {
    const id = e.target.value;
    setSelectedSheetId(id);
    setShowAllUploads(id === 'ALL');
    if (id === 'ALL') {
      const allRows = (availableSheets || []).reduce((acc, s) => acc.concat(s.uploadedData || []), []);
      setUploadResults(filterRowsByDate(allRows, filter.startDate, filter.endDate));
      setUploadedSheet(null);
    } else {
      const sel = (availableSheets || []).find(s => s._id === id);
      setUploadedSheet(sel || null);
      setUploadResults(filterRowsByDate(sel?.uploadedData || [], filter.startDate, filter.endDate));
    }
  };

  const downloadExcelTemplate = () => {
    try {
      // Create template data
      const templateData = [
        {
          'Month': 'January',
          'S.No.': 1,
          'Order Date': '2024-01-15',
          'Order id': 'ORD-001',
          'SKU': 'SKU-001',
          'Quantity': 2,
          'Status': 'Delivered',
          'Payment': 150,
          'Payment Date': '2024-01-16',
          'Payment Status': 'Paid',
          'Purchase Price': 100,
          'Profit': 50,
          'Re-use / Claim': 'No',
          'Reused Date': '',
          'Status of Product': 'Good',
          'Remarks': 'Sample order'
        },
        {
          'Month': 'January',
          'S.No.': 2,
          'Order Date': '2024-01-20',
          'Order id': 'ORD-002',
          'SKU': 'SKU-002',
          'Quantity': 1,
          'Status': 'Pending',
          'Payment': 200,
          'Payment Date': '2024-01-21',
          'Payment Status': 'Pending',
          'Purchase Price': 150,
          'Profit': 50,
          'Re-use / Claim': 'Yes',
          'Reused Date': '2024-01-25',
          'Status of Product': 'Returned',
          'Remarks': 'Customer return'
        }
      ];

      // Create instructions sheet
      const instructionsData = [
        { 'Field': 'Month', 'Format': 'Text', 'Example': 'January', 'Required': 'Yes' },
        { 'Field': 'S.No.', 'Format': 'Number', 'Example': '1', 'Required': 'Yes' },
        { 'Field': 'Order Date', 'Format': 'YYYY-MM-DD', 'Example': '2024-01-15', 'Required': 'Yes' },
        { 'Field': 'Order id', 'Format': 'Text', 'Example': 'ORD-001', 'Required': 'Yes' },
        { 'Field': 'SKU', 'Format': 'Text', 'Example': 'SKU-001', 'Required': 'Yes' },
        { 'Field': 'Quantity', 'Format': 'Number', 'Example': '2', 'Required': 'Yes' },
        { 'Field': 'Status', 'Format': 'Text', 'Example': 'Delivered', 'Required': 'Yes' },
        { 'Field': 'Payment', 'Format': 'Number', 'Example': '150', 'Required': 'Yes' },
        { 'Field': 'Payment Date', 'Format': 'YYYY-MM-DD', 'Example': '2024-01-16', 'Required': 'No' },
        { 'Field': 'Payment Status', 'Format': 'Text', 'Example': 'Paid', 'Required': 'No' },
        { 'Field': 'Purchase Price', 'Format': 'Number', 'Example': '100', 'Required': 'Yes' },
        { 'Field': 'Profit', 'Format': 'Number', 'Example': '50', 'Required': 'No' },
        { 'Field': 'Re-use / Claim', 'Format': 'Yes/No', 'Example': 'No', 'Required': 'No' },
        { 'Field': 'Reused Date', 'Format': 'YYYY-MM-DD', 'Example': '2024-01-25', 'Required': 'No' },
        { 'Field': 'Status of Product', 'Format': 'Text', 'Example': 'Good', 'Required': 'No' },
        { 'Field': 'Remarks', 'Format': 'Text', 'Example': 'Sample order', 'Required': 'No' }
      ];

      // Create workbook with multiple sheets
      const worksheet1 = XLSX.utils.json_to_sheet(templateData);
      const worksheet2 = XLSX.utils.json_to_sheet(instructionsData);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet1, 'Data Template');
      XLSX.utils.book_append_sheet(workbook, worksheet2, 'Instructions');

      // Auto-adjust column widths
      const colWidths = [
        { wch: 12 }, // Month
        { wch: 8 },  // S.No.
        { wch: 12 }, // Order Date
        { wch: 15 }, // Order id
        { wch: 12 }, // SKU
        { wch: 10 }, // Quantity
        { wch: 12 }, // Status
        { wch: 12 }, // Payment
        { wch: 12 }, // Payment Date
        { wch: 15 }, // Payment Status
        { wch: 15 }, // Purchase Price
        { wch: 10 }, // Profit
        { wch: 15 }, // Re-use / Claim
        { wch: 12 }, // Reused Date
        { wch: 15 }, // Status of Product
        { wch: 20 }  // Remarks
      ];
      worksheet1['!cols'] = colWidths;

      XLSX.writeFile(workbook, 'profit_loss_template.xlsx');
      setError('');
    } catch (error) {
      setError('Failed to download template: ' + error.message);
    }
  };

  const exportToExcel = (data, filename = 'profit_loss_report.xlsx') => {
    if (!data || data.length === 0) {
      setError('No data to export');
      return;
    }

    try {
      // Transform data for export
      const exportData = data.map(item => ({
        'Combo ID': item.comboId || '',
        'Products': item.productNames || item.comboName || '',
        'Original Cost Price': formatNumberForExcel(item.costPrice),
        'Sold Price': formatNumberForExcel(item.soldPrice),
        'Quantity': item.quantity || '',
        'Profit/Loss': formatNumberForExcel(item.profitTotal),
        'Status': item.status?.toUpperCase() || 'ERROR',
        'Date': item.date ? new Date(item.date).toLocaleDateString() : '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Profit Loss');

      // Add summary sheet if available
      if (summary) {
        const summaryData = [
          { Metric: 'Total Profit/Loss', Amount: formatNumberForExcel(summary.totalProfit) },
          { Metric: 'Delivered Profit', Amount: formatNumberForExcel(summary.deliveredProfit) },
          { Metric: 'RPU Loss', Amount: formatNumberForExcel(summary.rpuProfit) },
          { Metric: 'Total Records', Amount: summary.totalRecords || 0 },
        ];
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      }

      XLSX.writeFile(workbook, filename);
      setError('');
    } catch (error) {
      setError('Failed to export to Excel: ' + error.message);
    }
  };

  const exportToPDF = (data, filename = 'profit_loss_report.pdf') => {
    if (!data || data.length === 0) {
      setError('No data to export');
      return;
    }

    try {
      // Create a table HTML
      let html = `
        <html>
          <head>
            <title>Profit & Loss Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #667eea; color: white; padding: 10px; text-align: left; }
              td { padding: 8px; border-bottom: 1px solid #ddd; }
              tr:hover { background-color: #f5f5f5; }
              .summary { margin-top: 30px; }
              .profit { color: #48bb78; font-weight: bold; }
              .loss { color: #e53e3e; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Profit & Loss Analysis Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
      `;

      // Add summary
      if (summary) {
        html += `
          <div class="summary">
            <h2>Summary</h2>
            <table>
              <tr>
                <th>Metric</th>
                <th>Amount</th>
              </tr>
                <tr>
                <td>Total Profit/Loss</td>
                <td class="${Number(summary?.totalProfit ?? 0) >= 0 ? 'profit' : 'loss'}">${Number(summary?.totalProfit ?? 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Delivered Profit</td>
                <td class="profit">${Number(summary?.deliveredProfit ?? 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>RPU Loss</td>
                <td class="loss">${Number(summary?.rpuProfit ?? 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Total Records</td>
                <td>${summary.totalRecords || 0}</td>
              </tr>
            </table>
          </div>
        `;
      }

      // Add data table
      html += `
        <h2>Detailed Records</h2>
        <table>
          <tr>
            <th>Combo ID</th>
            <th>Products</th>
            <th>Original Cost Price</th>
            <th>Sold Price</th>
            <th>Quantity</th>
            <th>Profit/Loss</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
      `;

      data.forEach(item => {
        const profitClass = Number(item.profitTotal ?? 0) >= 0 ? 'profit' : 'loss';
        html += `
          <tr>
            <td>${item.comboId || ''}</td>
            <td>${item.productNames || item.comboName || ''}</td>
            <td>${item.quantity || ''}</td>
            <td>${item.costPrice != null ? Number(item.costPrice).toFixed(2) : ''}</td>
            <td>${item.soldPrice != null ? Number(item.soldPrice).toFixed(2) : ''}</td>
                        <td class="${profitClass}">${item.profitTotal != null ? Number(item.profitTotal).toFixed(2) : ''}</td>
            <td>${item.status?.toUpperCase() || 'ERROR'}</td>
            <td>${item.date ? new Date(item.date).toLocaleDateString() : ''}</td>
          </tr>
        `;
      });

      html += `
          </table>
          </body>
        </html>
      `;

      // Create a blob and download
      const element = document.createElement('a');
      const file = new Blob([html], { type: 'text/html' });
      element.href = URL.createObjectURL(file);
      element.download = filename.replace('.pdf', '.html');
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      setError('PDF exported as HTML file. To save as PDF, use your browser\'s Print to PDF feature.');
    } catch (error) {
      setError('Failed to export to PDF: ' + error.message);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${THEME.offWhite} 0%, ${THEME.lightGold} 100%)`,
      padding: 4
    }}>
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          padding: 3,
          marginBottom: 3,
          background: `linear-gradient(135deg, ${THEME.charcoal} 0%, ${THEME.softCharcoal} 100%)`,
          borderRadius: 2,
          border: `2px solid ${THEME.gold}`,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            color: THEME.gold,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          Profit & Loss Analysis
        </Typography>
      </Paper>

      {error && (
        <Alert
          severity="error"
          onClose={() => setError('')}
          sx={{ marginBottom: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* Status Summary Cards */}
      {(summary || uploadResults.length > 0) && (
        <Grid container spacing={3} sx={{ marginBottom: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={4}
              sx={{
                padding: 3,
                textAlign: 'center',
                background: `linear-gradient(135deg, ${THEME.charcoal} 0%, ${THEME.softCharcoal} 100%)`,
                borderRadius: 2,
                border: `1px solid ${THEME.gold}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(212, 175, 55, 0.2)',
                  border: `1px solid ${THEME.richGold}`,
                }
              }}
            >
              <Typography variant="body2" sx={{ color: THEME.lightGold, fontWeight: 600, marginBottom: 1 }}>
                Delivered ({summary?.statusSummary?.delivered?.count ?? calculateUploadTotals(uploadResults)?.deliveredCount ?? 0})
              </Typography>
              <Typography variant="h4" sx={{ color: THEME.gold, fontWeight: 700 }}>
                {formatCurrency(summary?.deliveredPayment || uploadTotals?.deliveredPayment || 0)}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={4}
              sx={{
                padding: 3,
                textAlign: 'center',
                background: `linear-gradient(135deg, ${THEME.charcoal} 0%, ${THEME.softCharcoal} 100%)`,
                borderRadius: 2,
                border: `1px solid ${THEME.gold}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(212, 175, 55, 0.2)',
                  border: `1px solid ${THEME.richGold}`,
                }
              }}
            >
              <Typography variant="body2" sx={{ color: THEME.lightGold, fontWeight: 600, marginBottom: 1 }}>
                RPU ({summary?.statusSummary?.rpu?.count ?? calculateUploadTotals(uploadResults)?.rpuCount ?? 0})
              </Typography>
              <Typography variant="h4" sx={{ color: THEME.gold, fontWeight: 700 }}>
                {formatCurrency(summary?.rpuPayment || uploadTotals?.rpuPayment || 0)}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={4}
              sx={{
                padding: 3,
                textAlign: 'center',
                background: `linear-gradient(135deg, ${THEME.charcoal} 0%, ${THEME.softCharcoal} 100%)`,
                borderRadius: 2,
                border: `1px solid ${THEME.gold}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(212, 175, 55, 0.2)',
                  border: `1px solid ${THEME.richGold}`,
                }
              }}
            >
              <Typography variant="body2" sx={{ color: THEME.lightGold, fontWeight: 600, marginBottom: 1 }}>
                RTO ({summary?.statusSummary?.rto?.count ?? calculateUploadTotals(uploadResults)?.rtoCount ?? 0})
              </Typography>
              <Typography variant="h4" sx={{ color: THEME.gold, fontWeight: 700 }}>
                {formatCurrency(summary?.rtoPayment || uploadTotals?.rtoPayment || 0)}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={4}
              sx={{
                padding: 3,
                textAlign: 'center',
                background: `linear-gradient(135deg, ${THEME.charcoal} 0%, ${THEME.softCharcoal} 100%)`,
                borderRadius: 2,
                border: `1px solid ${THEME.gold}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 40px rgba(212, 175, 55, 0.2)`,
                  border: `1px solid ${THEME.richGold}`,
                }
              }}
            >
              <Typography variant="body2" sx={{ color: THEME.lightGold, fontWeight: 600, marginBottom: 1 }}>
                Total Products
              </Typography>
              <Typography variant="h4" sx={{ color: THEME.gold, fontWeight: 700 }}>
                {
                  summary?.totalProductCount ||
                  (uploadedSheet && uploadedSheet.totalProductCount) ||
                  (summary?.totalRecords || calculateUploadTotals(uploadResults)?.totalProducts || 0)
                }
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Filter Section */}
      <Paper
        elevation={3}
        sx={{
          padding: 3,
          marginBottom: 3,
          background: THEME.white,
          borderRadius: 2,
          border: `1px solid ${THEME.softGold}`,
        }}
      >
        <Typography variant="h6" sx={{ marginBottom: 2, color: THEME.charcoal, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          🔍 Date Range Filter
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              name="startDate"
              value={filter.startDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: THEME.gold },
                  '&.Mui-focused fieldset': { borderColor: THEME.gold },
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              name="endDate"
              value={filter.endDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: THEME.gold },
                  '&.Mui-focused fieldset': { borderColor: THEME.gold },
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={fetchProfitLoss}
              sx={{
                height: '56px',
                background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`,
                color: THEME.charcoal,
                fontWeight: 600,
                '&:hover': {
                  background: `linear-gradient(135deg, ${THEME.richGold} 0%, ${THEME.gold} 100%)`,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(212, 175, 55, 0.3)',
                }
              }}
            >
              <FaChartLine style={{ marginRight: '8px' }} /> Fetch Data
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={clearFilters}
              sx={{
                height: '56px',
                borderColor: THEME.gold,
                color: THEME.gold,
                fontWeight: 600,
                '&:hover': {
                  borderColor: THEME.richGold,
                  background: `rgba(212, 175, 55, 0.1)`,
                }
              }}
            >
              🗑️ Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Excel Upload Section */}
      <Paper
        elevation={3}
        sx={{
          padding: 3,
          marginBottom: 3,
          background: THEME.white,
          borderRadius: 2,
          border: `1px solid ${THEME.softGold}`,
        }}
      >
        <Typography variant="h6" sx={{ marginBottom: 2, color: THEME.charcoal, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          📁 Upload Excel File
        </Typography>
        <Grid container spacing={2} sx={{ marginBottom: 2 }}>
          <Grid item xs={12} md={6}>
            <input
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              id="excel-file-upload"
              type="file"
              onChange={handleFileUpload}
              disabled={loading}
            />
            <label htmlFor="excel-file-upload" style={{ width: '100%' }}>
              <Button
                fullWidth
                variant="outlined"
                component="span"
                disabled={loading}
                sx={{
                  height: '56px',
                  borderColor: THEME.gold,
                  color: THEME.gold,
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: THEME.richGold,
                    background: `rgba(212, 175, 55, 0.1)`,
                  }
                }}
              >
                Choose Excel File
              </Button>
            </label>
            <Typography variant="caption" sx={{ display: 'block', marginTop: 1, color: '#666' }}>
              Columns: Month, S.No., Order Date, Order id, SKU, Quantity, Status, Payment, Payment Date, Payment Status, Purchase Price, Profit, Re-use/Claim, Reused Date, Status of Product, Remarks
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="outlined"
              onClick={downloadExcelTemplate}
              sx={{
                height: '56px',
                borderColor: THEME.gold,
                color: THEME.gold,
                fontWeight: 600,
                '&:hover': {
                  borderColor: THEME.richGold,
                  background: `rgba(212, 175, 55, 0.1)`,
                }
              }}
            >
              <FaDownload style={{ marginRight: '8px' }} /> Download Template
            </Button>
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <FormControl fullWidth>
              <InputLabel>Load Saved Uploads</InputLabel>
              <Select
                value={selectedSheetId || ''}
                onChange={handleSelectSheet}
                label="Load Saved Uploads"
                sx={{
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: THEME.gold },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME.gold },
                }}
              >
                <MenuItem value="">-- Select saved upload --</MenuItem>
                <MenuItem value="ALL">All uploads</MenuItem>
                {(availableSheets || []).map(s => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.fileName} ({s.uploadDate ? new Date(s.uploadDate).toLocaleString() : 'Unknown date'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => fetchUploadedData(filter.startDate, filter.endDate)}
              sx={{
                height: '56px',
                borderColor: THEME.gold,
                color: THEME.gold,
                fontWeight: 600,
                '&:hover': {
                  borderColor: THEME.richGold,
                  background: `rgba(212, 175, 55, 0.1)`,
                }
              }}
            >
              🔁 Refresh Uploads
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Monthly Profit Chart */}
      {monthlyData.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            padding: 3,
            marginBottom: 3,
            background: THEME.white,
            borderRadius: 2,
            border: `1px solid ${THEME.softGold}`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <Typography variant="h6" sx={{ color: THEME.charcoal, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              📈 Monthly Profit Trend
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => exportToExcel(monthlyData, 'monthly_profit_report.xlsx')}
                sx={{
                  borderColor: '#48bb78',
                  color: '#48bb78',
                  '&:hover': { borderColor: '#38a169', background: 'rgba(72, 187, 120, 0.1)' }
                }}
              >
                <FaFileExcel style={{ marginRight: '4px' }} /> Excel
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => exportToPDF(monthlyData, 'monthly_profit_report.pdf')}
                sx={{
                  borderColor: '#e53e3e',
                  color: '#e53e3e',
                  '&:hover': { borderColor: '#c53030', background: 'rgba(229, 62, 62, 0.1)' }
                }}
              >
                <FaFilePdf style={{ marginRight: '4px' }} /> PDF
              </Button>
            </Box>
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', padding: 5 }}>
              <CircularProgress sx={{ color: THEME.gold }} />
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => (value == null || Number.isNaN(Number(value)) ? '-' : `$${Number(value).toFixed(2)}`)}
                  contentStyle={{
                    backgroundColor: THEME.offWhite,
                    border: `2px solid ${THEME.gold}`,
                    borderRadius: '10px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="totalProfit" stroke={THEME.gold} name="Total Profit" strokeWidth={2} />
                <Line type="monotone" dataKey="deliveredProfit" stroke="#48bb78" name="Delivered Profit" strokeWidth={2} />
                <Line type="monotone" dataKey="rpuProfit" stroke="#e53e3e" name="RPU Loss" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Paper>
      )}

      {/* Profit/Loss Data Table */}
      {profitData.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            padding: 3,
            marginBottom: 3,
            background: THEME.white,
            borderRadius: 2,
            border: `1px solid ${THEME.softGold}`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <Typography variant="h6" sx={{ color: THEME.charcoal, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              📊 Profit/Loss Breakdown
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => exportToExcel(profitData, 'profit_loss_database_report.xlsx')}
                sx={{
                  borderColor: '#48bb78',
                  color: '#48bb78',
                  '&:hover': { borderColor: '#38a169', background: 'rgba(72, 187, 120, 0.1)' }
                }}
              >
                <FaFileExcel style={{ marginRight: '4px' }} /> Excel
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => exportToPDF(profitData, 'profit_loss_database_report.pdf')}
                sx={{
                  borderColor: '#e53e3e',
                  color: '#e53e3e',
                  '&:hover': { borderColor: '#c53030', background: 'rgba(229, 62, 62, 0.1)' }
                }}
              >
                <FaFilePdf style={{ marginRight: '4px' }} /> PDF
              </Button>
            </Box>
          </Box>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Product/Combo</TableCell>
                  <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Cost Price</TableCell>
                  <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Sold Price</TableCell>
                  <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Quantity</TableCell>
                  <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Profit/Loss</TableCell>
                  <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {profitData.slice(0, 20).map((item, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      '&:hover': {
                        background: `rgba(212, 175, 55, 0.1)`,
                      }
                    }}
                  >
                    <TableCell>{item.date ? new Date(item.date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{item.product}</TableCell>
                    <TableCell>{formatCurrency(item.costPrice)}</TableCell>
                    <TableCell>{formatCurrency(item.soldPrice)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <Chip
                        label={formatCurrency(item.profitTotal)}
                        sx={{
                          background: Number(item.profitTotal ?? 0) >= 0 ? '#48bb78' : '#e53e3e',
                          color: THEME.white,
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {item.status === 'rpu' ? (
                        <Typography sx={{ color: '#e53e3e', fontWeight: 600 }}> RPU</Typography>
                      ) : (
                        <Typography sx={{ color: '#48bb78', fontWeight: 600 }}> Delivered</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleEditProfitRowClick(item)}
                          sx={{
                            borderColor: THEME.gold,
                            color: THEME.gold,
                            minWidth: 'auto',
                            '&:hover': { borderColor: THEME.richGold }
                          }}
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => deleteProfitRow(item)}
                          sx={{
                            borderColor: '#e53e3e',
                            color: '#e53e3e',
                            minWidth: 'auto',
                            '&:hover': { borderColor: '#c53030' }
                          }}
                        >
                          🗑️ Delete
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="body2" sx={{ marginTop: 2, textAlign: 'center', color: '#666' }}>
            Showing {profitData.slice(0, 20).length} of {profitData.length} records
          </Typography>
        </Paper>
      )}

      {/* Uploaded Data Table */}
      {uploadResults.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            padding: 3,
            marginBottom: 3,
            background: THEME.white,
            borderRadius: 2,
            border: `1px solid ${THEME.softGold}`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <Typography variant="h6" sx={{ color: THEME.charcoal, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              📊 Uploaded Profit/Loss Data ({uploadResults.length} records)
            </Typography>
            {(() => {
              const totals = calculateUploadTotals(uploadResults);
              return totals && (
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ color: THEME.gold, fontWeight: 600 }}>
                    📦 {totals.totalProducts} products | 💰 {formatCurrency(totals.totalPayment)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    Payment: {formatCurrency(totals.totalPayment)}
                  </Typography>
                </Box>
              );
            })()}
          </Box>
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {['Month', 'S.No.', 'Order Date', 'Order id', 'SKU', 'Quantity', 'Status', 'Payment', 'Payment Date', 'Payment Status', 'Purchase Price', 'Profit', 'Re-use / Claim', 'Reused Date', 'Status of Product', 'Remarks'].map((header) => (
                    <TableCell key={header} sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {uploadResults.map((result, index) => {
                  const status = (result.Status || result.status || '').toLowerCase().trim();
                  let statusDisplay;
                  if (status === 'delivered' || status === 'delivery') {
                    statusDisplay = <Typography sx={{ color: '#28a745', fontWeight: 600, fontSize: '0.875rem' }}>✅ Delivered</Typography>;
                  } else if (status === 'rpu' || status === 'returned' || status === 'rpo') {
                    statusDisplay = <Typography sx={{ color: '#dc3545', fontWeight: 600, fontSize: '0.875rem' }}>🔄 RPU</Typography>;
                  } else if (status === 'rto' || status === 'return to origin') {
                    statusDisplay = <Typography sx={{ color: '#ff6347', fontWeight: 600, fontSize: '0.875rem' }}>📦 RTO</Typography>;
                  } else {
                    statusDisplay = <Typography sx={{ color: '#6c757d', fontSize: '0.875rem' }}>{result.Status || result.status || '-'}</Typography>;
                  }

                  return (
                    <TableRow
                      key={index}
                      sx={{
                        '&:hover': {
                          background: `rgba(212, 175, 55, 0.1)`,
                        }
                      }}
                    >
                      <TableCell>{result.Month || result.month || '-'}</TableCell>
                      <TableCell>{result['S.No.'] || result.sno || '-'}</TableCell>
                      <TableCell>{result['Order Date'] || result.orderDate || '-'}</TableCell>
                      <TableCell>{result['Order id'] || result.orderId || '-'}</TableCell>
                      <TableCell>{result.SKU || result.sku || '-'}</TableCell>
                      <TableCell>{result.Quantity || result.quantity || '-'}</TableCell>
                      <TableCell>{statusDisplay}</TableCell>
                      <TableCell>{result.Payment || result.payment || '-'}</TableCell>
                      <TableCell>{result['Payment Date'] || result.paymentDate || '-'}</TableCell>
                      <TableCell>{result['Payment Status'] || result.paymentStatus || '-'}</TableCell>
                      <TableCell>{result['Purchase Price'] || result.purchasePrice || '-'}</TableCell>
                      <TableCell>{result.Profit || result.profit || '-'}</TableCell>
                      <TableCell>{result['Re-use / Claim'] || result.reuseOrClaim || '-'}</TableCell>
                      <TableCell>{result['Reused Date'] || result.reusedDate || '-'}</TableCell>
                      <TableCell>{result['Status of Product'] || result.statusOfProduct || '-'}</TableCell>
                      <TableCell>{result.Remarks || result.remarks || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Upload Results Modal - Note: This modal is not being displayed but kept for potential use */}
      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle sx={{ background: `linear-gradient(135deg, ${THEME.charcoal} 0%, ${THEME.softCharcoal} 100%)`, color: THEME.gold }}>
          <Typography variant="h6" component="div">
            📊 Upload Results & Export
            {(() => {
              const totals = calculateUploadTotals(uploadResults);
              return totals && (
                <Typography variant="caption" component="span" sx={{ marginLeft: 2, color: '#999', fontWeight: 'normal' }}>
                  ({totals.totalProducts} products, {formatCurrency(totals.totalPayment)} total)
                </Typography>
              );
            })()}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {/* Upload Summary */}
          {(() => {
            const totals = calculateUploadTotals(uploadResults);
            return totals && (
              <Box sx={{ marginBottom: 3, marginTop: 2, padding: 2, backgroundColor: THEME.offWhite, borderRadius: 2, border: `1px solid ${THEME.softGold}` }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" sx={{ color: '#666' }}>Delivered Payment</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#28a745' }}>
                      {formatCurrency(totals.deliveredPayment)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" sx={{ color: '#666' }}>RPU Payment</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#dc3545' }}>
                      {formatCurrency(totals.rpuPayment)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" sx={{ color: '#666' }}>RTO Payment</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ff6347' }}>
                      {formatCurrency(totals.rtoPayment)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" sx={{ color: '#666' }}>Total Products</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: THEME.gold }}>
                      {totals.totalProducts}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            );
          })()}

          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {['Month', 'S.No.', 'Order Date', 'Order id', 'SKU', 'Quantity', 'Status', 'Payment', 'Payment Date', 'Payment Status', 'Purchase Price', 'Profit', 'Re-use / Claim', 'Reused Date', 'Status of Product', 'Remarks', 'Actions'].map((header) => (
                    <TableCell key={header} sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {uploadResults.map((result, index) => {
                  const status = (result.Status || result.status || '').toLowerCase().trim();
                  let statusDisplay;
                  if (status === 'delivered' || status === 'delivery') {
                    statusDisplay = <Typography sx={{ color: '#28a745', fontWeight: 600, fontSize: '0.875rem' }}> Delivered</Typography>;
                  } else if (status === 'rpu' || status === 'returned' || status === 'rpo') {
                    statusDisplay = <Typography sx={{ color: '#dc3545', fontWeight: 600, fontSize: '0.875rem' }}> RPU</Typography>;
                  } else if (status === 'rto' || status === 'return to origin') {
                    statusDisplay = <Typography sx={{ color: '#ff6347', fontWeight: 600, fontSize: '0.875rem' }}> RTO</Typography>;
                  } else {
                    statusDisplay = <Typography sx={{ color: '#6c757d', fontSize: '0.875rem' }}>{result.Status || result.status || '-'}</Typography>;
                  }

                  return (
                    <TableRow key={index}>
                      <TableCell>{result.Month || result.month || '-'}</TableCell>
                      <TableCell>{result['S.No.'] || result.sno || result.serialNumber || '-'}</TableCell>
                      <TableCell>{result['Order Date'] || result.orderDate || '-'}</TableCell>
                      <TableCell>{result['Order id'] || result.orderId || result.orderid || '-'}</TableCell>
                      <TableCell>{result.SKU || result.sku || '-'}</TableCell>
                      <TableCell>{result.Quantity || result.quantity || '-'}</TableCell>
                      <TableCell>{statusDisplay}</TableCell>
                      <TableCell>{result.Payment || result.payment || '-'}</TableCell>
                      <TableCell>{result['Payment Date'] || result.paymentDate || '-'}</TableCell>
                      <TableCell>{result['Payment Status'] || result.paymentStatus || '-'}</TableCell>
                      <TableCell>{result['Purchase Price'] || result.purchasePrice || '-'}</TableCell>
                      <TableCell>{result.Profit || result.profit || '-'}</TableCell>
                      <TableCell>{result['Re-use / Claim'] || result.reuseOrClaim || '-'}</TableCell>
                      <TableCell>{result['Reused Date'] || result.reusedDate || '-'}</TableCell>
                      <TableCell>{result['Status of Product'] || result.statusOfProduct || '-'}</TableCell>
                      <TableCell>{result.Remarks || result.remarks || '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleEditClick(result)}
                            sx={{ borderColor: THEME.gold, color: THEME.gold, minWidth: 'auto' }}
                          >
                            ✏️
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => deleteRow(result._id || result.id)}
                            sx={{ borderColor: '#e53e3e', color: '#e53e3e', minWidth: 'auto' }}
                          >
                            🗑️
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ padding: 2, background: THEME.offWhite }}>
          <Button
            variant="outlined"
            onClick={() => exportToExcel(uploadResults, 'profit_loss_upload_report.xlsx')}
            sx={{ borderColor: '#48bb78', color: '#48bb78' }}
          >
            <FaFileExcel style={{ marginRight: '4px' }} /> Export to Excel
          </Button>
          <Button
            variant="outlined"
            onClick={() => exportToPDF(uploadResults, 'profit_loss_upload_report.pdf')}
            sx={{ borderColor: '#e53e3e', color: '#e53e3e' }}
          >
            <FaFilePdf style={{ marginRight: '4px' }} /> Export to PDF
          </Button>
          <Button
            variant="contained"
            onClick={() => setShowModal(false)}
            sx={{ background: THEME.gold, color: THEME.charcoal }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Row Modal */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ background: `linear-gradient(135deg, ${THEME.charcoal} 0%, ${THEME.softCharcoal} 100%)`, color: THEME.gold }}>
          ✏️ Edit Row
        </DialogTitle>
        <DialogContent sx={{ marginTop: 2 }}>
          {editingRow && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Order id"
                  value={editingRow.orderId || editingRow['Order id'] || ''}
                  onChange={(e) => handleEditChange('orderId', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: THEME.gold },
                      '&.Mui-focused fieldset': { borderColor: THEME.gold },
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Order Date"
                  type="date"
                  value={editingRow.orderDate || ''}
                  onChange={(e) => handleEditChange('orderDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: THEME.gold },
                      '&.Mui-focused fieldset': { borderColor: THEME.gold },
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SKU"
                  value={editingRow.SKU || editingRow.sku || ''}
                  onChange={(e) => handleEditChange('sku', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: THEME.gold },
                      '&.Mui-focused fieldset': { borderColor: THEME.gold },
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  value={editingRow.Quantity || editingRow.quantity || ''}
                  onChange={(e) => handleEditChange('quantity', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: THEME.gold },
                      '&.Mui-focused fieldset': { borderColor: THEME.gold },
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Status"
                  value={editingRow.Status || editingRow.status || ''}
                  onChange={(e) => handleEditChange('status', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: THEME.gold },
                      '&.Mui-focused fieldset': { borderColor: THEME.gold },
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Payment"
                  value={editingRow.Payment || editingRow.payment || ''}
                  onChange={(e) => handleEditChange('payment', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: THEME.gold },
                      '&.Mui-focused fieldset': { borderColor: THEME.gold },
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Purchase Price"
                  value={editingRow['Purchase Price'] || editingRow.purchasePrice || ''}
                  onChange={(e) => handleEditChange('purchasePrice', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: THEME.gold },
                      '&.Mui-focused fieldset': { borderColor: THEME.gold },
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Profit"
                  value={editingRow.Profit || editingRow.profit || ''}
                  onChange={(e) => handleEditChange('profit', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: THEME.gold },
                      '&.Mui-focused fieldset': { borderColor: THEME.gold },
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Remarks"
                  multiline
                  rows={3}
                  value={editingRow.Remarks || editingRow.remarks || ''}
                  onChange={(e) => handleEditChange('remarks', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: THEME.gold },
                      '&.Mui-focused fieldset': { borderColor: THEME.gold },
                    }
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: 2, background: THEME.offWhite }}>
          <Button
            variant="contained"
            onClick={saveEditedRow}
            disabled={loading}
            sx={{
              background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`,
              color: THEME.charcoal,
              '&:hover': {
                background: `linear-gradient(135deg, ${THEME.richGold} 0%, ${THEME.gold} 100%)`,
              }
            }}
          >
            Save
          </Button>
          <Button
            variant="outlined"
            onClick={() => setShowEditModal(false)}
            sx={{
              borderColor: THEME.gold,
              color: THEME.gold,
              '&:hover': {
                borderColor: THEME.richGold,
                background: `rgba(212, 175, 55, 0.1)`,
              }
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Profit Row Modal */}
      <Dialog open={showEditProfitModal} onClose={() => setShowEditProfitModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: `linear-gradient(135deg, ${THEME.charcoal} 0%, ${THEME.softCharcoal} 100%)`, color: THEME.gold }}>
          ✏️ Edit Profit Row
        </DialogTitle>
        <DialogContent sx={{ marginTop: 2 }}>
          {editingProfitRow && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="SKU / Barcode"
                  disabled
                  value={editingProfitRow.item?.barcode || editingProfitRow.item?.productName || ''}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={editingProfitRow.item?.quantity || 0}
                  onChange={(e) => handleEditProfitRowChange('quantity', Number(e.target.value))}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: THEME.gold },
                      '&.Mui-focused fieldset': { borderColor: THEME.gold },
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Unit Price"
                  type="number"
                  value={editingProfitRow.item?.unitPrice || 0}
                  onChange={(e) => handleEditProfitRowChange('unitPrice', Number(e.target.value))}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: THEME.gold },
                      '&.Mui-focused fieldset': { borderColor: THEME.gold },
                    }
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: 2, background: THEME.offWhite }}>
          <Button
            variant="contained"
            onClick={saveEditedProfitRow}
            disabled={loading}
            sx={{
              background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`,
              color: THEME.charcoal,
              '&:hover': {
                background: `linear-gradient(135deg, ${THEME.richGold} 0%, ${THEME.gold} 100%)`,
              }
            }}
          >
            Save
          </Button>
          <Button
            variant="outlined"
            onClick={() => setShowEditProfitModal(false)}
            sx={{
              borderColor: THEME.gold,
              color: THEME.gold,
              '&:hover': {
                borderColor: THEME.richGold,
                background: `rgba(212, 175, 55, 0.1)`,
              }
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading State */}
      {loading && profitData.length === 0 && uploadResults.length === 0 && (
        <Box sx={{ textAlign: 'center', padding: 4 }}>
          <CircularProgress sx={{ color: THEME.gold }} size={60} />
          <Typography variant="h6" sx={{ marginTop: 2, color: THEME.charcoal }}>
            Processing...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ProfitLoss;
