import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Card,
  CardContent
} from '@mui/material';
import { uploadedProfitSheetsAPI } from '../services/api';
import { FaEye, FaTrash, FaSearch, FaSync, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';

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

const UploadedDataManagement = () => {
  const [uploads, setUploads] = useState([]);
  const [filteredUploads, setFilteredUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [summary, setSummary] = useState(null);

  // Deduction states
  // Deduction states
  const [showGlobalDeductionModal, setShowGlobalDeductionModal] = useState(false);
  const [globalDeduction, setGlobalDeduction] = useState({ reason: '', amount: '' });
  const [globalDeductionsList, setGlobalDeductionsList] = useState([]);

  const fetchGlobalDeductions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/global-deductions');
      if (response.ok) {
        const data = await response.json();
        setGlobalDeductionsList(data);
      }
    } catch (error) {
      console.error('Failed to fetch global deductions:', error);
    }
  };

  const handleAddGlobalDeduction = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/global-deductions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalDeduction)
      });

      if (!response.ok) throw new Error('Failed to add global deduction');

      setGlobalDeduction({ reason: '', amount: '' });
      setShowGlobalDeductionModal(false);
      setSuccess('Global deduction added successfully');
      fetchGlobalDeductions();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteGlobalDeduction = async (id) => {
    if (!window.confirm('Delete this deduction?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/global-deductions/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete deduction');

      setSuccess('Global deduction deleted successfully');
      fetchGlobalDeductions();
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch uploads
  useEffect(() => {
    fetchUploads();
    fetchSummary();
    fetchGlobalDeductions();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = uploads;

    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (startDate || endDate) {
      filtered = filtered.filter(u => {
        const uploadDate = new Date(u.uploadDate);
        if (startDate && uploadDate < new Date(startDate)) return false;
        if (endDate && uploadDate > new Date(new Date(endDate).setHours(23, 59, 59, 999))) return false;
        return true;
      });
    }

    setFilteredUploads(filtered);
  }, [uploads, searchTerm, startDate, endDate]);

  const fetchUploads = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await uploadedProfitSheetsAPI.getAll();
      setUploads(response.data);
    } catch (err) {
      setError('Failed to fetch uploads: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await uploadedProfitSheetsAPI.getSummary();
      console.log('Summary response:', response.data); // Debug log
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this upload record? This action cannot be undone.')) {
      try {
        await uploadedProfitSheetsAPI.delete(id);
        setSuccess('Upload record deleted successfully');
        fetchUploads();
        fetchSummary();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete: ' + err.message);
      }
    }
  };

  const handleViewDetails = async (upload) => {
    setSelectedUpload(upload);
    setShowDetailsModal(true);
  };

  const downloadAsExcel = (upload) => {
    try {
      const worksheetData = (upload.uploadedData || []).map(item => ({
        'Combo ID': item.comboId,
        'Combo Name': item.comboName,
        'Products': item.productNames,
        'Quantity': item.quantity,
        'Cost Price': item.costPrice,
        'Sold Price': item.soldPrice,
        'Profit per Unit': item.profitPerUnit,
        'Total Profit': item.profitTotal,
        'Status': item.status,
        'Date': new Date(item.date).toLocaleDateString()
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Profit Data');

      // Set column widths
      const colWidths = [15, 20, 25, 10, 12, 12, 15, 12, 12, 12];
      worksheet['!cols'] = colWidths.map(width => ({ wch: width }));

      XLSX.writeFile(workbook, `${upload.fileName || 'profit-report'}.xlsx`);
      setSuccess('File downloaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to download: ' + err.message);
    }
  };

  const formatCurrency = (value) => {
    const num = Number(value) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num);
  };

  // Calculate totals from all uploads
  const calculateAllUploadTotals = () => {
    if (!uploads || uploads.length === 0) return null;

    let totalProducts = 0;
    let deliveredPayment = 0;
    let rpuPayment = 0;
    let rtoPayment = 0;
    let totalPayment = 0;

    uploads.forEach(upload => {
      if (upload.uploadedData && upload.uploadedData.length > 0) {
        upload.uploadedData.forEach(item => {
          const quantity = Number(item.Quantity || item.quantity || 1);
          // Normalize payment value: strip non-numeric except dot and minus, then parse
          const rawPayment = item.Payment || item.payment || item.Amount || item.amount ||
            item.Price || item.price || item.Total || item.total ||
            item.Value || item.value || item['Payment Amount'] ||
            item['Sale Amount'] || item['Order Amount'] || 0;
          const paymentStr = String(rawPayment).replace(/[^0-9.-]/g, '');
          const payment = Math.abs(parseFloat(paymentStr) || 0);
          const status = (item.Status || item.status || '').toLowerCase().trim();

          totalProducts += quantity;
          totalPayment += payment;

          if (status === 'delivered' || status === 'delivery') {
            deliveredPayment += payment;
          } else if (status === 'rpu' || status === 'returned' || status === 'rpo') {
            rpuPayment += payment;
          } else if (status === 'rto' || status === 'return to origin') {
            rtoPayment += payment;
          }
        });
      }
    });

    return {
      totalProducts,
      deliveredPayment,
      rpuPayment,
      rtoPayment,
      totalPayment
    };
  };

  // Calculate total purchase price for all delivered items across all uploads
  const calculateDeliveredPurchaseTotal = () => {
    if (!uploads || uploads.length === 0) return 0;

    let totalPurchase = 0;

    uploads.forEach(upload => {
      if (upload.uploadedData && upload.uploadedData.length > 0) {
        upload.uploadedData.forEach(item => {
          const status = (item.Status || item.status || '').toLowerCase().trim();
          if (status === 'delivered' || status === 'delivery') {
            const qty = Number(item.Quantity || item.quantity || 1) || 0;

            const rawCost = item.CostPrice || item.costPrice || item['Cost Price'] || item.PurchasePrice || item.purchasePrice || item.Purchase || item.purchase || item.Cost || item.cost || 0;
            const costStr = String(rawCost).replace(/[^0-9.-]/g, '');
            const cost = Math.abs(parseFloat(costStr) || 0);

            totalPurchase += cost * qty;
          }
        });
      }
    });

    return totalPurchase;
  };

  // Calculate payment totals for a single upload object
  const calculateUploadPaymentTotals = (upload) => {
    if (!upload || !upload.uploadedData || upload.uploadedData.length === 0) return {
      deliveredPayment: 0,
      rpuPayment: 0,
      rtoPayment: 0,
      totalPayment: 0
    };

    let deliveredPayment = 0;
    let rpuPayment = 0;
    let rtoPayment = 0;
    let totalPayment = 0;

    upload.uploadedData.forEach(item => {
      const rawPayment = item.Payment || item.payment || item.Amount || item.amount ||
        item.Price || item.price || item.Total || item.total ||
        item.Value || item.value || item['Payment Amount'] ||
        item['Sale Amount'] || item['Order Amount'] || 0;

      const paymentStr = String(rawPayment).replace(/[^0-9.-]/g, '');
      const payment = Math.abs(parseFloat(paymentStr) || 0);

      const status = (item.Status || item.status || '').toLowerCase().trim();

      totalPayment += payment;
      if (status === 'delivered' || status === 'delivery') {
        deliveredPayment += payment;
      } else if (status === 'rpu' || status === 'returned' || status === 'rpo') {
        rpuPayment += payment;
      } else if (status === 'rto' || status === 'return to origin') {
        rtoPayment += payment;
      }
    });

    return { deliveredPayment, rpuPayment, rtoPayment, totalPayment };
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ color: THEME.gold, fontWeight: 700, marginBottom: 0.5 }}>
            📊 Uploaded Data Management
          </Typography>
          <Typography variant="body2" sx={{ color: THEME.lightGold }}>
            View and manage all previously uploaded profit sheets
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => {
            fetchUploads();
            fetchSummary();
          }}
          sx={{
            background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`,
            color: THEME.charcoal,
            fontWeight: 600,
            '&:hover': {
              background: `linear-gradient(135deg, ${THEME.richGold} 0%, ${THEME.gold} 100%)`,
            }
          }}
        >
          <FaSync style={{ marginRight: '8px' }} /> Refresh
        </Button>
      </Paper>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ marginBottom: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ marginBottom: 2 }}>{success}</Alert>}

      {/* Summary Cards */}
      {(summary || uploads.length > 0) && (
        <>
          <Grid container spacing={2} sx={{ marginBottom: 4 }}>
            {/* 1. Delivered Purchase Total */}
            <Grid item xs={12} sm={4} md={2}>
              <Paper
                elevation={4}
                sx={{
                  padding: 2,
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${THEME.charcoal} 0%, ${THEME.softCharcoal} 100%)`,
                  borderRadius: 2,
                  border: `1px solid ${THEME.gold}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 40px rgba(212, 175, 55, 0.2)`,
                    border: `1px solid ${THEME.richGold}`,
                  }
                }}
              >
                <Typography variant="h5" sx={{ color: THEME.gold, fontWeight: 700, marginBottom: 0.5 }}>
                  {formatCurrency(calculateDeliveredPurchaseTotal())}
                </Typography>
                <Typography variant="caption" sx={{ color: THEME.lightGold, fontWeight: 600 }}>
                  Delivered Purchase Total
                </Typography>
              </Paper>
            </Grid>

            {/* 2. Delivered */}
            <Grid item xs={12} sm={4} md={2}>
              <Paper
                elevation={4}
                sx={{
                  padding: 3,
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${THEME.charcoal} 0%, ${THEME.softCharcoal} 100%)`,
                  borderRadius: 2,
                  border: `1px solid ${THEME.gold}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(212, 175, 55, 0.2)',
                    border: `1px solid ${THEME.richGold}`,
                  }
                }}
              >
                <Typography variant="h5" sx={{ color: THEME.gold, fontWeight: 700, marginBottom: 1 }}>
                  {formatCurrency(
                    summary?.paymentSummary?.deliveredPayment ||
                    calculateAllUploadTotals()?.deliveredPayment || 0
                  )}
                </Typography>
                <Typography variant="caption" sx={{ color: THEME.lightGold, fontWeight: 600 }}>
                  Delivered
                </Typography>
              </Paper>
            </Grid>

            {/* 3. RPU */}
            <Grid item xs={12} sm={4} md={2}>
              <Paper
                elevation={4}
                sx={{
                  padding: 3,
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${THEME.charcoal} 0%, ${THEME.softCharcoal} 100%)`,
                  borderRadius: 2,
                  border: `1px solid ${THEME.gold}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(212, 175, 55, 0.2)',
                    border: `1px solid ${THEME.richGold}`,
                  }
                }}
              >
                <Typography variant="h5" sx={{ color: THEME.gold, fontWeight: 700, marginBottom: 1 }}>
                  {formatCurrency(
                    summary?.paymentSummary?.rpuPayment ||
                    calculateAllUploadTotals()?.rpuPayment || 0
                  )}
                </Typography>
                <Typography variant="caption" sx={{ color: THEME.lightGold, fontWeight: 600 }}>
                  RPU
                </Typography>
              </Paper>
            </Grid>

            {/* 4. Total Payment */}
            <Grid item xs={12} sm={4} md={2}>
              <Paper
                elevation={4}
                sx={{
                  padding: 2,
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${THEME.charcoal} 0%, ${THEME.softCharcoal} 100%)`,
                  borderRadius: 2,
                  border: `1px solid ${THEME.gold}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 40px rgba(212, 175, 55, 0.2)`,
                    border: `1px solid ${THEME.richGold}`,
                  }
                }}
              >
                <Typography variant="h5" sx={{ color: THEME.gold, fontWeight: 700, marginBottom: 0.5 }}>
                  {formatCurrency(summary?.paymentSummary?.totalPayment || calculateAllUploadTotals()?.totalPayment || 0)}
                </Typography>
                <Typography variant="caption" sx={{ color: THEME.lightGold, fontWeight: 600 }}>
                  Total Payment
                </Typography>
              </Paper>
            </Grid>

            {/* 5. Total Products */}
            <Grid item xs={12} sm={4} md={2}>
              <Paper
                elevation={4}
                sx={{
                  padding: 3,
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${THEME.charcoal} 0%, ${THEME.softCharcoal} 100%)`,
                  borderRadius: 2,
                  border: `1px solid ${THEME.gold}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 40px rgba(212, 175, 55, 0.2)`,
                    border: `1px solid ${THEME.richGold}`,
                  }
                }}
              >
                <Typography variant="h5" sx={{ color: THEME.gold, fontWeight: 700, marginBottom: 1 }}>
                  {((summary?.statusSummary?.delivered?.count || 0) +
                    (summary?.statusSummary?.rpu?.count || 0) +
                    (summary?.statusSummary?.rto?.count || 0)) ||
                    calculateAllUploadTotals()?.totalProducts || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: THEME.lightGold, fontWeight: 600 }}>
                  Total Products
                </Typography>
              </Paper>
            </Grid>

            {/* 6. Total Sheets */}
            <Grid item xs={12} sm={4} md={2}>
              <Paper
                elevation={4}
                sx={{
                  padding: 3,
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${THEME.charcoal} 0%, ${THEME.softCharcoal} 100%)`,
                  borderRadius: 2,
                  border: `1px solid ${THEME.gold}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 40px rgba(212, 175, 55, 0.2)`,
                    border: `1px solid ${THEME.richGold}`,
                  }
                }}
              >
                <Typography variant="h5" sx={{ color: THEME.gold, fontWeight: 700, marginBottom: 1 }}>
                  {summary?.totalUploads || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: THEME.lightGold, fontWeight: 600 }}>
                  Total Sheets
                </Typography>
              </Paper>
            </Grid>

            {/* 7. Net Profit */}
            <Grid item xs={12} sm={4} md={2}>
              <Paper
                elevation={4}
                onClick={() => setShowGlobalDeductionModal(true)}
                sx={{
                  padding: 3,
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${THEME.charcoal} 0%, ${THEME.softCharcoal} 100%)`,
                  borderRadius: 2,
                  border: `1px solid ${THEME.gold}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(212, 175, 55, 0.2)',
                    border: `1px solid ${THEME.richGold}`,
                  }
                }}
              >
                <Typography sx={{ position: 'absolute', top: 5, right: 10, fontSize: '1rem', color: THEME.gold }}>+</Typography>
                <Typography variant="h5" sx={{ color: THEME.gold, fontWeight: 700, marginBottom: 1 }}>
                  {formatCurrency(
                    ((summary?.paymentSummary?.deliveredPayment || calculateAllUploadTotals()?.deliveredPayment || 0) -
                      (summary?.paymentSummary?.rpuPayment || calculateAllUploadTotals()?.rpuPayment || 0)) -
                    (globalDeductionsList.reduce((acc, curr) => acc + (curr.amount || 0), 0)) -
                    (calculateDeliveredPurchaseTotal() || 0)
                  )}
                </Typography>
                <Typography variant="caption" sx={{ color: THEME.lightGold, fontWeight: 600 }}>
                  Net Profit
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Global Deductions Table */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 2 }}>
            <Typography variant="h6" sx={{ color: THEME.charcoal, fontWeight: 600 }}>
              Global Deductions
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setShowGlobalDeductionModal(true)}
              sx={{
                borderColor: THEME.gold,
                color: THEME.gold,
                '&:hover': { borderColor: THEME.richGold, background: `rgba(212, 175, 55, 0.1)` }
              }}
            >
              + Add Deduction
            </Button>
          </Box>
          {globalDeductionsList.length > 0 ? (
            <TableContainer component={Paper} sx={{ marginBottom: 4, borderRadius: 2, border: `1px solid ${THEME.softGold}` }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Reason</TableCell>
                    <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Amount</TableCell>
                    <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {globalDeductionsList.map((deduction, idx) => (
                    <TableRow key={idx} sx={{ '&:hover': { background: `rgba(212, 175, 55, 0.1)` } }}>
                      <TableCell>{deduction.reason}</TableCell>
                      <TableCell>{formatCurrency(deduction.amount)}</TableCell>
                      <TableCell>{new Date(deduction.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteGlobalDeduction(deduction._id)}
                          sx={{ color: '#e53e3e' }}
                        >
                          <FaTrash />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" sx={{ color: '#999', marginBottom: 4 }}>No global deductions added.</Typography>
          )}

        </>
      )}

      {/* Filter Card */}
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
        <Typography variant="h6" sx={{ marginBottom: 2, color: THEME.charcoal, fontWeight: 600 }}>
          🔍 Search & Filter
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search File Name"
              placeholder="Search by filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
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
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: THEME.gold },
                  '&.Mui-focused fieldset': { borderColor: THEME.gold },
                }
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Uploads Table */}
      {loading ? (
        <Box sx={{ textAlign: 'center', padding: 5 }}>
          <CircularProgress sx={{ color: THEME.gold }} size={60} />
          <Typography variant="h6" sx={{ marginTop: 2, color: THEME.charcoal }}>Loading uploads...</Typography>
        </Box>
      ) : filteredUploads.length === 0 ? (
        <Alert severity="info">No upload records found</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, border: `1px solid ${THEME.softGold}` }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>File Name</TableCell>
                <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Upload Date</TableCell>
                <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Products</TableCell>
                <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Delivered</TableCell>
                <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>RPU</TableCell>
                <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>RTO</TableCell>
                <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUploads.map(upload => (
                <TableRow key={upload._id} sx={{ '&:hover': { background: `rgba(212, 175, 55, 0.1)` } }}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>{upload.fileName}</Typography>
                  </TableCell>
                  <TableCell>{upload.uploadDate ? new Date(upload.uploadDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-'}</TableCell>
                  <TableCell>{((upload?.statusSummary?.delivered?.count || 0) + (upload?.statusSummary?.rpu?.count || 0) + (upload?.statusSummary?.rto?.count || 0))}</TableCell>
                  <TableCell sx={{ color: '#28a745', fontWeight: 600 }}>{formatCurrency(upload?.paymentSummary?.deliveredPayment || calculateUploadPaymentTotals(upload).deliveredPayment)}</TableCell>
                  <TableCell sx={{ color: '#dc3545', fontWeight: 600 }}>{formatCurrency(upload?.paymentSummary?.rpuPayment || calculateUploadPaymentTotals(upload).rpuPayment || 0)}</TableCell>
                  <TableCell sx={{ color: '#ff6347', fontWeight: 600 }}>{formatCurrency(upload?.paymentSummary?.rtoPayment || calculateUploadPaymentTotals(upload).rtoPayment || 0)}</TableCell>
                  <TableCell>
                    <Chip label={upload.status || 'Unknown'} color="success" size="small" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(upload)}
                        title="View Details"
                        sx={{ color: '#17a2b8' }}
                      >
                        <FaEye />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => downloadAsExcel(upload)}
                        title="Download as Excel"
                        sx={{ color: '#28a745' }}
                      >
                        <FaDownload />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(upload._id)}
                        title="Delete"
                        sx={{ color: '#e53e3e' }}
                      >
                        <FaTrash />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Details Modal */}
      <Dialog
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ background: `linear-gradient(135deg, ${THEME.charcoal} 0%, ${THEME.softCharcoal} 100%)`, color: THEME.gold }}>
          Upload Details - {selectedUpload?.fileName}
        </DialogTitle>
        <DialogContent sx={{ marginTop: 2 }}>
          {selectedUpload && (
            <>
              <Grid container spacing={2} sx={{ marginBottom: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: THEME.charcoal }}>Upload Date:</Typography>
                  <Typography variant="body2">{new Date(selectedUpload.uploadDate).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: THEME.charcoal }}>Total Records:</Typography>
                  <Typography variant="body2">{selectedUpload?.successRecords || 0} successful / {selectedUpload?.totalRecords || 0} total</Typography>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ marginBottom: 3 }}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ padding: 2, textAlign: 'center', background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: THEME.white }}>
                      {formatCurrency(selectedUpload?.paymentSummary?.deliveredPayment || calculateUploadPaymentTotals(selectedUpload).deliveredPayment)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: THEME.white }}> Delivered Payment</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ padding: 2, textAlign: 'center', background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: THEME.white }}>
                      {formatCurrency(selectedUpload?.paymentSummary?.rtoPayment || calculateUploadPaymentTotals(selectedUpload).rtoPayment || 0)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: THEME.white }}>📦 RTO Payment</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ padding: 2, textAlign: 'center', background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)` }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: THEME.charcoal }}>
                      {formatCurrency(selectedUpload?.paymentSummary?.totalPayment || calculateUploadPaymentTotals(selectedUpload).totalPayment)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: THEME.charcoal }}>💰 Total Payment</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ marginTop: 4, marginBottom: 2, color: THEME.charcoal, fontWeight: 600 }}>📋 Detailed Records</Typography>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Combo ID</TableCell>
                      <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Quantity</TableCell>
                      <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Cost Price</TableCell>
                      <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Sold Price</TableCell>
                      <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Profit</TableCell>
                      <TableCell sx={{ background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`, color: THEME.charcoal, fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedUpload.uploadedData || []).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.comboId}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.costPrice)}</TableCell>
                        <TableCell>{formatCurrency(item.soldPrice)}</TableCell>
                        <TableCell sx={{ color: item.profitTotal >= 0 ? '#28a745' : '#dc3545', fontWeight: 600 }}>
                          {formatCurrency(item.profitTotal)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.status === 'rtu' ? ' RTO' : item.status === 'rpu' ? ' RPU' : ' Delivered'}
                            color={
                              item.status === 'delivered' ? 'success' :
                                item.status === 'rtu' ? 'warning' :
                                  item.status === 'rpu' ? 'error' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: 2, background: THEME.offWhite }}>
          {selectedUpload && (
            <Button
              variant="contained"
              onClick={() => downloadAsExcel(selectedUpload)}
              sx={{
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                color: THEME.white
              }}
            >
              <FaDownload style={{ marginRight: '8px' }} /> Download as Excel
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => setShowDetailsModal(false)}
            sx={{
              background: THEME.gold,
              color: THEME.charcoal
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Global Deduction Modal */}
      <Dialog
        open={showGlobalDeductionModal}
        onClose={() => setShowGlobalDeductionModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ background: `linear-gradient(135deg, ${THEME.charcoal} 0%, ${THEME.softCharcoal} 100%)`, color: THEME.gold }}>
          Add Global Deduction
        </DialogTitle>
        <DialogContent sx={{ marginTop: 2 }}>
          <Box component="form" onSubmit={handleAddGlobalDeduction} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Reason"
              placeholder="e.g., Office Rent, Salaries"
              value={globalDeduction.reason}
              onChange={(e) => setGlobalDeduction({ ...globalDeduction, reason: e.target.value })}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: THEME.gold },
                  '&.Mui-focused fieldset': { borderColor: THEME.gold },
                }
              }}
            />
            <TextField
              fullWidth
              label="Amount (₹)"
              type="number"
              placeholder="0.00"
              value={globalDeduction.amount}
              onChange={(e) => setGlobalDeduction({ ...globalDeduction, amount: e.target.value })}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: THEME.gold },
                  '&.Mui-focused fieldset': { borderColor: THEME.gold },
                }
              }}
            />
            <Button
              fullWidth
              variant="contained"
              type="submit"
              sx={{
                background: `linear-gradient(135deg, ${THEME.gold} 0%, ${THEME.richGold} 100%)`,
                color: THEME.charcoal,
                fontWeight: 600,
                marginTop: 2,
                '&:hover': {
                  background: `linear-gradient(135deg, ${THEME.richGold} 0%, ${THEME.gold} 100%)`,
                }
              }}
            >
              Add Global Deduction
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default UploadedDataManagement;