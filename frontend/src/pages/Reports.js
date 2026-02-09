import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  IconButton
} from '@mui/material';
import { FaUpload, FaSync, FaBoxOpen } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { reportsAPI, uploadedProfitSheetsAPI } from '../services/api';

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

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

const Reports = () => {
  // State for Spreadsheet Status Report
  const [products, setProducts] = useState([]);
  const [selectedStatusProduct, setSelectedStatusProduct] = useState('');
  const [uploadedSheets, setUploadedSheets] = useState([]);
  const [selectedSheetId, setSelectedSheetId] = useState('all');
  const [uploadedSheet, setUploadedSheet] = useState(null);
  const [uploadResults, setUploadResults] = useState([]);
  const [comboDetails, setComboDetails] = useState({});
  const [showBreakdown, setShowBreakdown] = useState(false);

  const [statusData, setStatusData] = useState([]);
  const [statusSummary, setStatusSummary] = useState({
    delivered: 0,
    rto: 0,
    rpu: 0,
    netProfit: 0,
    totalOrders: 0
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Re-run status processing if upload results change
  useEffect(() => {
    if (uploadResults && uploadResults.length > 0) {
      processUploadedStatusData();
    } else {
      // Reset summary if no data
      setStatusSummary({
        delivered: 0,
        rto: 0,
        rpu: 0,
        netProfit: 0,
        totalOrders: 0
      });
      setStatusData([]);
    }
  }, [uploadResults, selectedStatusProduct, comboDetails]);

  // Handle Sheet Selection
  useEffect(() => {
    const loadSheetData = async () => {
      let rowsToProcess = [];
      if (selectedSheetId === 'all') {
        const allRows = uploadedSheets.flatMap(sheet => sheet.uploadedData || []);
        rowsToProcess = allRows;
        setUploadResults(allRows);
      } else if (selectedSheetId) {
        const sheet = uploadedSheets.find(s => s._id === selectedSheetId);
        if (sheet) {
          rowsToProcess = sheet.uploadedData || [];
          setUploadResults(rowsToProcess);
          setUploadedSheet(sheet);
        }
      } else {
        if (!uploadedSheet) setUploadResults([]);
      }

      // Trigger combo lookup for the loaded rows
      if (rowsToProcess.length > 0) {
        fetchComboDetailsForRows(rowsToProcess);
      }
    };

    if (uploadedSheets.length > 0) {
      loadSheetData();
    }
  }, [selectedSheetId, uploadedSheets]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [productsRes, sheetsRes] = await Promise.all([
        reportsAPI.getProductsList(),
        uploadedProfitSheetsAPI.getAll()
      ]);
      setProducts(productsRes.data);
      setUploadedSheets(sheetsRes.data);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchComboDetailsForRows = async (rows) => {
    if (!rows || rows.length === 0) return;
    const skus = rows
      .map(r => r.sku || r.SKU)
      .filter(s => s && typeof s === 'string')
      .map(s => s.trim());

    // De-duplicate SKUs locally before sending
    const uniqueSkus = [...new Set(skus)];

    if (uniqueSkus.length > 0) {
      try {
        const comboRes = await reportsAPI.lookupCombos(uniqueSkus);
        setComboDetails(prev => ({ ...prev, ...comboRes.data }));
      } catch (err) {
        console.error('Failed to lookup combos:', err);
      }
    }
  };

  const handleReportFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        let data = XLSX.utils.sheet_to_json(ws);

        // Normalize keys
        data = data.map(row => {
          const newRow = {};
          Object.keys(row).forEach(key => {
            newRow[key.toLowerCase()] = row[key]; // Access via lowercase for consistency
            newRow[key] = row[key]; // Keep original too just in case
          });
          return newRow;
        });

        setUploadResults(data);
        setUploadedSheet(null); // Not a server-saved sheet yet
        setSelectedSheetId('');

        // Trigger lookup
        fetchComboDetailsForRows(data);
      } catch (err) {
        console.error('Error parsing file:', err);
        setError('Failed to parse Excel file');
      }
    };
    reader.readAsBinaryString(file);
  };

  const processUploadedStatusData = () => {
    let deliveredCount = 0;
    let rtoCount = 0;
    let rpuCount = 0;
    let netProfit = 0;
    let totalOrders = 0;

    const targetRows = uploadResults;

    targetRows.forEach(row => {
      const sku = (row.sku || row.SKU || '').trim();
      if (!sku) return;

      let includeRow = true;

      // If filtering by product
      if (selectedStatusProduct) {
        const combo = comboDetails[sku];
        if (!combo) {
          includeRow = false;
        } else {
          const hasProduct = combo.products.some(p => {
            const pId = p.productId || p.product?._id || p.product;
            return String(pId) === String(selectedStatusProduct);
          });
          if (!hasProduct) includeRow = false;
        }
      }

      if (includeRow) {
        totalOrders++;
        const status = (row.status || row.Status || '').toLowerCase().trim();
        const quantity = Number(row.quantity || row.Quantity || 1);

        let profitVal = 0;
        const profitRaw = row.profit || row.Profit || row['Net Profit'];
        if (profitRaw) {
          const cleaned = String(profitRaw).replace(/[^0-9.-]/g, '');
          profitVal = parseFloat(cleaned) || 0;
        }

        netProfit += profitVal;

        if (status === 'delivered' || status === 'delivery') {
          deliveredCount += quantity;
        } else if (status === 'rpu' || status === 'returned' || status === 'rpo') {
          rpuCount += quantity;
        } else if (status === 'rto' || status === 'return to origin') {
          rtoCount += quantity;
        }
      }
    });

    const summary = {
      delivered: deliveredCount,
      rto: rtoCount,
      rpu: rpuCount,
      netProfit: netProfit,
      totalOrders
    };

    const chartData = [
      { name: 'Delivered', value: deliveredCount, fill: '#48bb78' },
      { name: 'RTO', value: rtoCount, fill: '#f56565' },
      { name: 'RPU', value: rpuCount, fill: '#ed8936' }
    ];

    setStatusData(chartData);
    setStatusSummary(summary);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${THEME.offWhite} 0%, ${THEME.lightGold} 100%)`,
      padding: 4
    }}>
      {/* Page Header */}
      <Paper
        elevation={3}
        sx={{
          padding: 3,
          marginBottom: 3,
          background: `linear-gradient(135deg, ${THEME.charcoal} 0%, ${THEME.softCharcoal} 100%)`,
          borderRadius: 2,
          border: `2px solid ${THEME.gold}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ color: THEME.gold, fontWeight: 700, marginBottom: 0.5 }}>
            📈 Business Reports
          </Typography>
          <Typography variant="body2" sx={{ color: THEME.lightGold }}>
            Comprehensive analytics and status reports
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => { fetchInitialData(); }}
          sx={{
            background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`,
            color: THEME.charcoal,
            fontWeight: 600,
            '&:hover': {
              background: `linear-gradient(135deg, ${THEME.richGold} 0%, ${THEME.gold} 100%)`,
            }
          }}
        >
          <FaSync style={{ marginRight: '8px' }} /> Refresh Data
        </Button>
      </Paper>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ marginBottom: 2 }}>{error}</Alert>}

      {/* Spreadsheet Status Report Section */}
      <Paper
        elevation={3}
        sx={{
          padding: 3,
          background: THEME.white,
          borderRadius: 2,
          border: `1px solid ${THEME.softGold}`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <Typography variant="h6" sx={{ color: THEME.charcoal, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FaBoxOpen /> Spreadsheet Status Report (RTO/RPU/Delivered)
          </Typography>
        </Box>

        {/* 1. INPUTS ROW: 3 Stacked Rows (Full Width) */}
        {/* User requested: "3 next next straight rows" (from image which shows stack). Vertical Stack. */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>

          {/* ROW 1: Data Source */}
          <FormControl fullWidth size="small">
            <InputLabel>Select Data Source</InputLabel>
            <Select
              value={selectedSheetId}
              label="Select Data Source"
              onChange={(e) => setSelectedSheetId(e.target.value)}
            >
              <MenuItem value="all">All Uploaded Sheets (Aggregate)</MenuItem>
              {uploadedSheets.map(sheet => (
                <MenuItem key={sheet._id} value={sheet._id}>
                  {sheet.fileName} ({new Date(sheet.uploadDate).toLocaleDateString()})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* ROW 2: Upload Button */}
          <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <input
              accept=".xlsx, .xls"
              style={{ display: 'none' }}
              id="raised-button-file"
              type="file"
              onChange={handleReportFileUpload}
            />
            <label htmlFor="raised-button-file" style={{ flexGrow: 1 }}>
              <Button variant="outlined" component="span" startIcon={<FaUpload />} fullWidth>
                {uploadResults.length > 0 ? 'File Uploaded (Change)' : 'Upload Excel File'}
              </Button>
            </label>
            {uploadResults.length > 0 && (
              <Button
                size="small"
                color="error"
                onClick={() => { setUploadResults([]); setUploadedSheet(null); setComboDetails({}); }}
              >
                Clear
              </Button>
            )}
          </Box>

          {/* ROW 3: Product Filter */}
          <FormControl fullWidth size="small">
            <InputLabel>Filter by Product</InputLabel>
            <Select
              value={selectedStatusProduct}
              label="Filter by Product"
              onChange={(e) => setSelectedStatusProduct(e.target.value)}
            >
              <MenuItem value=""><em>All Products</em></MenuItem>
              {products.map(p => (
                <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Breakdown Toggle (Below Row 3) */}
          {uploadResults.length > 0 && (
            <Box>
              <Button
                variant="text"
                size="small"
                onClick={() => setShowBreakdown(!showBreakdown)}
              >
                {showBreakdown ? 'Hide' : 'Show'} Detailed Combo Breakdown
              </Button>
            </Box>
          )}
        </Box>

        {/* 2. STATS ROW: 3 Items side-by-side (Straight Row) - Net Profit Removed */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, width: '100%' }}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f0fdf4', border: '1px solid #48bb78', flex: 1, display: 'flex', flexDirection: 'column', justifyItems: 'center' }}>
            <Typography variant="h5" fontWeight="bold" color="#48bb78">{statusSummary.delivered}</Typography>
            <Typography variant="caption">Delivered</Typography>
          </Paper>

          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fef2f2', border: '1px solid #f56565', flex: 1, display: 'flex', flexDirection: 'column', justifyItems: 'center' }}>
            <Typography variant="h5" fontWeight="bold" color="#f56565">{statusSummary.rto}</Typography>
            <Typography variant="caption">RTO</Typography>
          </Paper>

          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff7ed', border: '1px solid #ed8936', flex: 1, display: 'flex', flexDirection: 'column', justifyItems: 'center' }}>
            <Typography variant="h5" fontWeight="bold" color="#ed8936">{statusSummary.rpu}</Typography>
            <Typography variant="caption">RPU</Typography>
          </Paper>
        </Box>

        {/* 3. BAR GRAPH (Restored) */}
        <Box sx={{ height: 400, mt: 4, mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Status Distribution</Typography>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name="Count" label={{ position: 'top' }} />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        {/* 4. BREAKDOWN TABLE */}
        {showBreakdown && uploadResults.length > 0 && (
          <TableContainer component={Paper} sx={{ maxHeight: 300, mt: 4 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>SKU</TableCell>
                  <TableCell>Combo/Product</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Qty</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {uploadResults.map((row, idx) => {
                  const sku = (row.sku || row.SKU || '').trim();
                  const details = comboDetails[sku];
                  const status = (row.status || row.Status || '').toString();

                  return (
                    <TableRow key={idx}>
                      <TableCell>{sku}</TableCell>
                      <TableCell>
                        {details ? (
                          <Box>
                            <Typography variant="subtitle2">{details.name}</Typography>
                            <ul style={{ margin: 0, paddingLeft: 15, fontSize: '0.8rem' }}>
                              {details.products.map((p, i) => (
                                <li key={i}>{p.productName} ({p.quantity})</li>
                              ))}
                            </ul>
                          </Box>
                        ) : <span style={{ color: 'red' }}>No Match</span>}
                      </TableCell>
                      <TableCell>
                        <Alert
                          icon={false}
                          severity={status.toLowerCase().includes('delivered') ? 'success' : status.toLowerCase().includes('rto') ? 'error' : 'warning'}
                          sx={{ py: 0, px: 1, '& .MuiAlert-message': { p: 0 } }}
                        >
                          {status}
                        </Alert>
                      </TableCell>
                      <TableCell>{row.quantity || row.Quantity}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

      </Paper>
    </Box>
  );
};

export default Reports;