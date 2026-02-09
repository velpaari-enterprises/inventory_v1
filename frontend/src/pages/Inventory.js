import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton,
  Chip,
  Button,
  CircularProgress,
  LinearProgress,
  Avatar,
  Checkbox,
  Fade,
  Stack,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { productsAPI } from '../services/api';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Column visibility states
  const [lowStockColumns, setLowStockColumns] = useState({
    product: true,
    currentStock: true,
    status: true,
    vendor: true
  });
  
  const [productColumns, setProductColumns] = useState({
    name: true,
    id: true,
    category: true,
    stockLevel: true,
    price: true,
    total: true,
    vendor: true,
    status: true
  });

  useEffect(() => {
    fetchInventory();
    fetchLowStock();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      setProducts(response.data);
      setError('');
    } catch (error) {
      setError('Failed to fetch inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStock = async () => {
    try {
      const response = await productsAPI.getLowStock();
      setLowStock(response.data);
    } catch (error) {
      console.error('Failed to fetch low stock');
    }
  };

  const clearError = () => {
    setError('');
  };

  const getStockStatus = (quantity, minquantity) => {
    if (quantity <= minquantity) return 'critical';
    return 'good';
  };

  const getStockStatusText = (quantity, minquantity) => {
    if (quantity <= minquantity) return 'CRITICAL';
    return 'GOOD';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const toggleLowStockColumn = (column) => {
    setLowStockColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const toggleProductColumn = (column) => {
    setProductColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress sx={{ color: '#000' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#000', fontWeight: 600, mb: 0.5 }}>
          Inventory Management
        </Typography>
        <Box sx={{ width: 60, height: 4, bgcolor: '#000', borderRadius: 1 }} />
      </Box>

      {/* Error Alert */}
      {error && (
        <Fade in={!!error}>
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <IconButton size="small" onClick={clearError}>
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {error}
          </Alert>
        </Fade>
      )}

      {/* Low Stock Section */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <WarningIcon sx={{ color: '#000' }} />
            <Typography variant="h6" sx={{ color: '#000', fontWeight: 600 }}>
              Low Stock Alerts
            </Typography>
          </Stack>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchLowStock}
            sx={{
              color: '#000',
              borderColor: '#000',
              '&:hover': {
                borderColor: '#000',
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            Refresh
          </Button>
        </Stack>

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
          {lowStock.length > 0 ? (
            <Table>
              <TableHead sx={{ bgcolor: '#D4AF37' }}>
                <TableRow>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Checkbox
                        checked={lowStockColumns.product}
                        onChange={() => toggleLowStockColumn('product')}
                        size="small"
                        sx={{ color: '#000', '&.Mui-checked': { color: '#000' } }}
                      />
                      <Typography variant="subtitle2" fontWeight={600} color="#000">Product</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Checkbox
                        checked={lowStockColumns.currentStock}
                        onChange={() => toggleLowStockColumn('currentStock')}
                        size="small"
                        sx={{ color: '#000', '&.Mui-checked': { color: '#000' } }}
                      />
                      <Typography variant="subtitle2" fontWeight={600} color="#000">Current Stock</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Checkbox
                        checked={lowStockColumns.status}
                        onChange={() => toggleLowStockColumn('status')}
                        size="small"
                        sx={{ color: '#000', '&.Mui-checked': { color: '#000' } }}
                      />
                      <Typography variant="subtitle2" fontWeight={600} color="#000">Status</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Checkbox
                        checked={lowStockColumns.vendor}
                        onChange={() => toggleLowStockColumn('vendor')}
                        size="small"
                        sx={{ color: '#000', '&.Mui-checked': { color: '#000' } }}
                      />
                      <Typography variant="subtitle2" fontWeight={600} color="#000">Vendor</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lowStock.map((product) => (
                  <TableRow key={product._id} hover sx={{ '&:hover': { bgcolor: '#F4E3B2' } }}>
                    <TableCell>
                      {lowStockColumns.product ? (
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ bgcolor: '#000', width: 36, height: 36, fontSize: '0.875rem' }}>
                            {product.name.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">{product.name}</Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.disabled">---</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {lowStockColumns.currentStock ? (
                        <Typography variant="body2">{product.quantity}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.disabled">---</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {lowStockColumns.status ? (
                        <Chip
                          label={getStockStatusText(product.quantity, product.reorderLevel)}
                          size="small"
                          sx={{
                            bgcolor: getStockStatus(product.quantity, product.reorderLevel) === 'critical' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(46, 125, 50, 0.1)',
                            color: getStockStatus(product.quantity, product.reorderLevel) === 'critical' ? '#d32f2f' : '#2e7d32',
                            fontWeight: 600,
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.disabled">---</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {lowStockColumns.vendor ? (
                        <Typography variant="body2">{product.vendor?.name || 'N/A'}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.disabled">---</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Alert severity="success" sx={{ m: 2, borderRadius: 2 }}>
              No low stock items. All products are well stocked!
            </Alert>
          )}
        </TableContainer>
      </Box>

      {/* All Products Section */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <InventoryIcon sx={{ color: '#000' }} />
            <Typography variant="h6" sx={{ color: '#000', fontWeight: 600 }}>
              All Products
            </Typography>
          </Stack>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchInventory}
            sx={{
              color: '#000',
              borderColor: '#000',
              '&:hover': {
                borderColor: '#000',
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            Refresh
          </Button>
        </Stack>

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
          {products.length > 0 ? (
            <Table>
              <TableHead sx={{ bgcolor: '#D4AF37' }}>
                <TableRow>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Checkbox
                        checked={productColumns.name}
                        onChange={() => toggleProductColumn('name')}
                        size="small"
                        sx={{ color: '#000', '&.Mui-checked': { color: '#000' } }}
                      />
                      <Typography variant="subtitle2" fontWeight={600} color="#000">Name</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Checkbox
                        checked={productColumns.id}
                        onChange={() => toggleProductColumn('id')}
                        size="small"
                        sx={{ color: '#000', '&.Mui-checked': { color: '#000' } }}
                      />
                      <Typography variant="subtitle2" fontWeight={600} color="#000">ID</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Checkbox
                        checked={productColumns.category}
                        onChange={() => toggleProductColumn('category')}
                        size="small"
                        sx={{ color: '#000', '&.Mui-checked': { color: '#000' } }}
                      />
                      <Typography variant="subtitle2" fontWeight={600} color="#000">Category</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Checkbox
                        checked={productColumns.stockLevel}
                        onChange={() => toggleProductColumn('stockLevel')}
                        size="small"
                        sx={{ color: '#000', '&.Mui-checked': { color: '#000' } }}
                      />
                      <Typography variant="subtitle2" fontWeight={600} color="#000">Stock Level</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Checkbox
                        checked={productColumns.price}
                        onChange={() => toggleProductColumn('price')}
                        size="small"
                        sx={{ color: '#000', '&.Mui-checked': { color: '#000' } }}
                      />
                      <Typography variant="subtitle2" fontWeight={600} color="#000">Price</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Checkbox
                        checked={productColumns.total}
                        onChange={() => toggleProductColumn('total')}
                        size="small"
                        sx={{ color: '#000', '&.Mui-checked': { color: '#000' } }}
                      />
                      <Typography variant="subtitle2" fontWeight={600} color="#000">Total</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Checkbox
                        checked={productColumns.vendor}
                        onChange={() => toggleProductColumn('vendor')}
                        size="small"
                        sx={{ color: '#000', '&.Mui-checked': { color: '#000' } }}
                      />
                      <Typography variant="subtitle2" fontWeight={600} color="#000">Vendor</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Checkbox
                        checked={productColumns.status}
                        onChange={() => toggleProductColumn('status')}
                        size="small"
                        sx={{ color: '#000', '&.Mui-checked': { color: '#000' } }}
                      />
                      <Typography variant="subtitle2" fontWeight={600} color="#000">Status</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product._id} hover sx={{ '&:hover': { bgcolor: '#F4E3B2' } }}>
                    <TableCell>
                      {productColumns.name ? (
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ bgcolor: '#000', width: 36, height: 36, fontSize: '0.875rem' }}>
                            {product.name.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">{product.name}</Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.disabled">---</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {productColumns.id ? (
                        <Typography variant="body2">{product.barcode}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.disabled">---</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {productColumns.category ? (
                        <Typography variant="body2">
                          {typeof product.category === 'object' 
                            ? product.category?.name || 'Uncategorized'
                            : product.category || 'Uncategorized'}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.disabled">---</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {productColumns.stockLevel ? (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>{product.quantity}</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(product.quantity / Math.max(product.quantity * 2, 100)) * 100}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: '#f5f5f5',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: product.quantity <= (product.reorderLevel || 10) ? '#d32f2f' : product.quantity <= 50 ? '#ed6c02' : '#2e7d32',
                                borderRadius: 3,
                              },
                            }}
                          />
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.disabled">---</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {productColumns.price ? (
                        <Typography variant="body2">{formatCurrency(product.price)}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.disabled">---</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {productColumns.total ? (
                        <Typography variant="body2">{formatCurrency(product.price * product.quantity)}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.disabled">---</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {productColumns.vendor ? (
                        <Typography variant="body2">{product.vendor?.name || 'N/A'}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.disabled">---</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {productColumns.status ? (
                        <Chip
                          label={getStockStatusText(product.quantity, product.reorderLevel || 10)}
                          size="small"
                          sx={{
                            bgcolor: getStockStatus(product.quantity, product.reorderLevel || 10) === 'critical' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(46, 125, 50, 0.1)',
                            color: getStockStatus(product.quantity, product.reorderLevel || 10) === 'critical' ? '#d32f2f' : '#2e7d32',
                            fontWeight: 600,
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.disabled">---</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <InventoryIcon sx={{ fontSize: 48, color: '#bdbdbd', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Products Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Get started by adding your first product.
              </Typography>
            </Box>
          )}
        </TableContainer>
      </Box>
    </Box>
  );
};

export default Inventory;
