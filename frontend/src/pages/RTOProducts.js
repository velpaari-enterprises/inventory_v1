import React, { useState, useEffect, useCallback } from 'react';
import { rtoProductsAPI, returnsAPI } from '../services/api';
import { socket } from '../services/socket';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Button,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import InventoryIcon from '@mui/icons-material/Inventory';

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

const RTOProducts = () => {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('RTO');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const returnsResponse = await returnsAPI.getAll();
      const returns = returnsResponse.data || [];
      
      // Convert all returns to product format
      const allReturnProducts = returns.flatMap(returnItem => 
        returnItem.items?.map(item => ({
          _id: `${returnItem._id}-${item.product}`,
          rtoId: returnItem.returnId,
          productName: item.productName,
          barcode: item.barcode,
          quantity: item.quantity,
          price: item.unitPrice,
          totalValue: item.total,
          category: returnItem.category,
          customerName: returnItem.customerName,
          reason: returnItem.reason,
          returnDate: returnItem.returnDate
        })) || []
      );
      
      // Filter by active tab
      const filteredProducts = allReturnProducts.filter(product => product.category === activeTab);
      
      setProducts(filteredProducts);
      setAllProducts(allReturnProducts);
    } catch (err) {
      console.error('API Error:', err);
      setError('Failed to fetch products: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const fetchInventory = useCallback(async () => {
    setInventoryLoading(true);
    try {
      const resp = await rtoProductsAPI.getAll({ category: activeTab });
      const items = resp.data || [];
      // If no persistent inventory exists for RPU, fall back to returns data
      if ((items.length === 0 || !items) && activeTab === 'RPU') {
        try {
          const returnsResp = await returnsAPI.getAll();
          const returns = returnsResp.data || [];
          const rpuFromReturns = returns
            .filter(r => r.category === 'RPU')
            .flatMap(ret => (ret.items || []).map(item => ({
              _id: `${ret._id}-${item.product || item.productId}`,
              dateAdded: ret.returnDate || ret.createdAt,
              rtoId: ret.returnId,
              addedBy: ret.customerName,
              product: item.product || item.productId,
              barcode: item.barcode || item.barcode,
              productName: item.productName,
              initialQuantity: item.quantity,
              quantity: item.quantity,
              price: item.unitPrice || item.unitPrice,
            })));

          setInventoryItems(rpuFromReturns);
        } catch (err2) {
          console.error('Failed to fetch fallback RPU from returns:', err2);
          setInventoryItems([]);
        }
      } else {
        setInventoryItems(items);
      }
    } catch (err) {
      console.error('Failed to fetch inventory items:', err);
      setError('Failed to fetch inventory items: ' + (err.message || err));
    } finally {
      setInventoryLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchProducts();
    fetchInventory();
  }, [fetchProducts, fetchInventory, activeTab]);

  useEffect(() => {
    const handleRtoChange = () => {
      fetchProducts();
      fetchInventory();
    };

    socket.on('returns:changed', handleRtoChange);
    socket.on('rto-products:changed', handleRtoChange);
    socket.on('inventory:changed', handleRtoChange);

    return () => {
      socket.off('returns:changed', handleRtoChange);
      socket.off('rto-products:changed', handleRtoChange);
      socket.off('inventory:changed', handleRtoChange);
    };
  }, [fetchProducts, fetchInventory]);

  return (
    <Box sx={{ p: 3, backgroundColor: THEME.offWhite, minHeight: '100vh' }}>
      {/* Header Section */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: '0 2px 10px rgba(212, 175, 55, 0.15)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: THEME.charcoal, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AssignmentReturnIcon sx={{ fontSize: '2rem', color: THEME.gold }} />
              RTO/RPU Products
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
              Return To Origin and Returned Product Under Process inventory
            </Typography>
          </Box>
            <Button
            variant="outlined"
            onClick={() => fetchInventory()}
            sx={{
              borderColor: THEME.gold,
              color: THEME.gold,
              '&:hover': { borderColor: THEME.richGold, bgcolor: THEME.lightGold },
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {inventoryLoading ? (
              <CircularProgress size={18} sx={{ color: THEME.gold, mr: 1 }} />
            ) : (
              <RefreshIcon sx={{ mr: 1 }} />
            )}
            {`Refresh ${activeTab} Inventory`}
          </Button>
        </Box>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign: 'center', boxShadow: '0 2px 10px rgba(212, 175, 55, 0.15)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h3" sx={{ color: THEME.gold, fontWeight: 700, mb: 1 }}>
                {allProducts.filter(p => p.category === 'RTO' || p.rtoStatus === 'RTO').length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                RTO Items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign: 'center', boxShadow: '0 2px 10px rgba(212, 175, 55, 0.15)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h3" sx={{ color: THEME.softGold, fontWeight: 700, mb: 1 }}>
                {allProducts.filter(p => p.category === 'RPU' || p.rtoStatus === 'RPU').length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                RPU Items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign: 'center', boxShadow: '0 2px 10px rgba(212, 175, 55, 0.15)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h3" sx={{ color: THEME.richGold, fontWeight: 700, mb: 1 }}>
                ₹{allProducts.reduce((sum, p) => sum + ((p.quantity || p.rtoQuantity || 0) * (p.price || 0)), 0).toFixed(2)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Total Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tab Navigation */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              color: '#666'
            },
            '& .Mui-selected': {
              color: `${THEME.gold} !important`
            },
            '& .MuiTabs-indicator': {
              backgroundColor: THEME.gold,
              height: 3
            }
          }}
        >
          <Tab label="RTO Products" value="RTO" />
          <Tab label="RPU Products" value="RPU" />
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: THEME.gold, mb: 2 }} />
          <Typography variant="body1" sx={{ color: '#666' }}>
            Loading products...
          </Typography>
        </Box>
      ) : products.length === 0 ? (
        <Alert severity="info">
          No {activeTab} products found. Create {activeTab} entries from the Products page.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: '0 2px 10px rgba(212, 175, 55, 0.15)', borderRadius: 2, mb: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: THEME.gold }}>
              <TableRow>
                <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Return ID</TableCell>
                <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Product Name</TableCell>
                <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Customer</TableCell>
                <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Quantity</TableCell>
                <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Unit Price</TableCell>
                <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Total</TableCell>
                <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Reason</TableCell>
                <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map(product => (
                <TableRow key={product._id} hover sx={{ '&:hover': { bgcolor: '#F4E3B2' } }}>
                  <TableCell>
                    <Chip
                      label={product.rtoId || product.barcode || 'N/A'}
                      size="small"
                      sx={{
                        bgcolor: activeTab === 'RTO' ? THEME.softGold : THEME.lightGold,
                        color: THEME.black,
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                  <TableCell>{product.productName || product.name}</TableCell>
                  <TableCell>{product.customerName || 'N/A'}</TableCell>
                  <TableCell>{product.quantity || product.rtoQuantity}</TableCell>
                  <TableCell>₹{(product.price || 0).toFixed(2)}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    ₹{((product.quantity || product.rtoQuantity || 0) * (product.price || 0)).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={product.reason === 'not_satisfied' ? 'Customer not reached' : product.reason === 'wrong_item' ? 'Wrong item delivered (claim)' : product.reason || product.rtoReason || 'N/A'}
                      size="small"
                      sx={{ bgcolor: '#e0e0e0', color: THEME.black }}
                    />
                  </TableCell>
                  <TableCell>
                    {product.returnDate ? new Date(product.returnDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* RTO Inventory Table */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: THEME.charcoal, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon sx={{ color: THEME.gold }} />
          {activeTab === 'RTO' ? 'RTO Inventory' : 'RPU Inventory'}
        </Typography>
        {inventoryItems.length === 0 ? (
          <Alert severity="info">No {activeTab} persistent inventory available.</Alert>
        ) : (
          <TableContainer component={Paper} sx={{ boxShadow: '0 2px 10px rgba(212, 175, 55, 0.15)', borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ bgcolor: THEME.gold }}>
                <TableRow>
                  <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>S.No.</TableCell>
                  <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>RTO ID</TableCell>
                  <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Customer Name</TableCell>
                  <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Product ID</TableCell>
                  <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Product Name</TableCell>
                  <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Quantity Added</TableCell>
                  <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Remaining Quantity</TableCell>
                  <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Unit Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventoryItems.map((r, idx) => (
                  <TableRow key={r._id} hover sx={{ '&:hover': { bgcolor: THEME.lightGold } }}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      {r.dateAdded ? new Date(r.dateAdded).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={r.rtoId}
                        size="small"
                        sx={{ bgcolor: THEME.softGold, color: THEME.black, fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>{r.addedBy || r.customerName || '-'}</TableCell>
                    <TableCell>{r.product?.barcode || r.barcode || '-'}</TableCell>
                    <TableCell>{r.productName || r.product?.name || '-'}</TableCell>
                    <TableCell>{(r.initialQuantity ?? r.quantity) || 0}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{r.quantity || 0}</TableCell>
                    <TableCell>₹{(r.price || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default RTOProducts;