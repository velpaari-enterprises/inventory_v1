import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Paper,
  Chip,
  CircularProgress,
  Snackbar,
  Tabs,
  Tab,
  Grid,
  Typography,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  FileUpload as FileUploadIcon,
  Download as DownloadIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { combosAPI, productsAPI, productMastersAPI, barcodesAPI, categoriesAPI } from '../services/api';
import { socket } from '../services/socket';



const Combos = () => {
  const [combos, setCombos] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Excel upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // Checkbox selection for barcode download
  const [selectedCombos, setSelectedCombos] = useState([]);
  const [isDownloadingBarcodes, setIsDownloadingBarcodes] = useState(false);

  // Delete state
  const [deletingComboId, setDeletingComboId] = useState(null);

  // Editable upload data
  const [editingCell, setEditingCell] = useState(null);
  const [editableData, setEditableData] = useState([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Image Preview Modal
  const [imagePreviewModal, setImagePreviewModal] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [previewImageName, setPreviewImageName] = useState('');

  const handleImageClick = (imageUrl, comboName) => {
    if (imageUrl) {
      setPreviewImageUrl(imageUrl);
      setPreviewImageName(comboName);
      setImagePreviewModal(true);
    }
  };

  const handleCloseImagePreview = () => {
    setImagePreviewModal(false);
    setPreviewImageUrl('');
    setPreviewImageName('');
  };

  // Add Item modal
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedComboForItem, setSelectedComboForItem] = useState(null);
  const [itemProduct, setItemProduct] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    barcode: '',
    category: '',
    products: [],
    image: null
  });

  // Product selection for combo
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productQuantity, setProductQuantity] = useState(1);

  const fetchCombos = useCallback(async () => {
    try {
      console.log('Fetching combos...');
      const response = await combosAPI.getAll();
      console.log('Combos response:', response.data);
      setCombos(response.data || []);
      if (response.data?.length > 0) {
        showSuccess(`Loaded ${response.data.length} combos`);
      }
    } catch (error) {
      console.error('Failed to fetch combos:', error);
      showError('Failed to load combos');
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchCombos(),
        fetchProducts(),
        fetchCategories()
      ]);
    } catch (error) {
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [fetchCombos, fetchProducts, fetchCategories]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleCombosChange = () => {
      fetchCombos();
    };
    const handleProductsChange = () => {
      fetchProducts();
    };
    const handleCategoriesChange = () => {
      fetchCategories();
    };

    socket.on('combos:changed', handleCombosChange);
    socket.on('products:changed', handleProductsChange);
    socket.on('inventory:changed', handleProductsChange);
    socket.on('categories:changed', handleCategoriesChange);

    return () => {
      socket.off('combos:changed', handleCombosChange);
      socket.off('products:changed', handleProductsChange);
      socket.off('inventory:changed', handleProductsChange);
      socket.off('categories:changed', handleCategoriesChange);
    };
  }, [fetchCombos, fetchProducts, fetchCategories]);



  // Toast helper functions
  const showToast = (message, variant = 'success') => {
    const id = Date.now();
    const toast = {
      id,
      message,
      variant,
      show: true
    };
    
    setToasts(prev => [...prev, toast]);
    
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message) => showToast(message, 'success');
  const showError = (message) => showToast(message, 'danger');

  const handleShowModal = () => {
    setShowModal(true);
    setEditMode(false);
    setFormData({
      name: '',
      description: '',
      barcode: '',
      category: '',
      products: [],
      image: null
    });
    setSelectedProduct('');
    setProductQuantity(1);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      image: file
    }));
  };

  const handleAddProduct = () => {
    if (!selectedProduct || productQuantity < 1) {
      showError('Please select a product and enter a valid quantity');
      return;
    }

    const product = products.find(p => p._id === selectedProduct);
    if (!product) {
      showError('Selected product not found');
      return;
    }

    // Check if there's enough stock
    if (product.quantity < productQuantity) {
      showError(`Insufficient stock! Only ${product.quantity} units available, but you're trying to add ${productQuantity}`);
      return;
    }

    // Check if product is out of stock
    if (product.quantity === 0) {
      showError('Cannot add out-of-stock product to combo');
      return;
    }

    // Check if product is already added
    const existingProductIndex = formData.products.findIndex(
      p => p.product._id === selectedProduct
    );

    setFormData(prev => {
      let updatedProducts = [...prev.products];

      if (existingProductIndex !== -1) {
        // Update quantity if product already exists
        updatedProducts[existingProductIndex] = {
          ...updatedProducts[existingProductIndex],
          quantity: updatedProducts[existingProductIndex].quantity + productQuantity
        };
      } else {
        // Add new product
        updatedProducts.push({
          product: product,
          quantity: productQuantity
        });
      }

      return {
        ...prev,
        products: updatedProducts
      };
    });

    // Reset selection
    setSelectedProduct('');
    setProductQuantity(1);
    showSuccess(`${product.name} added to combo`);
  };

  const handleRemoveProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
    showSuccess('Product removed from combo');
  };

  const handleUpdateProductQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;

    setFormData(prev => {
      const updatedProducts = [...prev.products];
      updatedProducts[index] = {
        ...updatedProducts[index],
        quantity: newQuantity
      };
      return {
        ...prev,
        products: updatedProducts
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.barcode) {
      showError('Name and barcode are required');
      return;
    }

    if (formData.products.length === 0) {
      showError('Please add at least one product to the combo');
      return;
    }

    try {
      setLoading(true);
      
      const calculatedPrice = calculateComboValue();
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('barcode', formData.barcode);
      formDataToSend.append('price', calculatedPrice.toString());
      
      if (formData.category) {
        formDataToSend.append('category', formData.category);
      }
      
      // Add products data
      formDataToSend.append('products', JSON.stringify(
        formData.products.map(p => ({
          product: p.product._id,
          quantity: p.quantity
        }))
      ));

      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      // Debug: Log what we're sending
      console.log('FormData contents:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, ':', value);
      }

      if (editMode && selectedCombo) {
        await combosAPI.update(selectedCombo._id, formDataToSend);
        showSuccess('Combo updated successfully');
      } else {
        await combosAPI.create(formDataToSend);
        showSuccess('Combo created successfully');
      }

      handleCloseModal();
      fetchCombos();
    } catch (error) {
      console.error('Submit error:', error);
      showError(error.response?.data?.message || 'Failed to save combo');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (combo) => {
    setSelectedCombo(combo);
    setEditMode(true);
    setFormData({
      name: combo.name,
      description: combo.description || '',
      barcode: combo.barcode,
      category: combo.category?._id || combo.category || '',
      products: combo.products || [],
      image: null
    });
    setShowModal(true);
  };

  const handleView = (combo) => {
    setSelectedCombo(combo);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    // Prevent multiple delete operations
    if (deletingComboId) {
      showError('Please wait, another delete operation is in progress');
      return;
    }

    if (window.confirm('Are you sure you want to delete this combo? This action cannot be undone.')) {
      try {
        setDeletingComboId(id);
        console.log('Attempting to delete combo with ID:', id);
        
        const response = await combosAPI.delete(id);
        console.log('Delete response:', response.data);
        
        if (response.data.success || response.data.message === 'Combo deleted successfully') {
          showSuccess('Combo deleted successfully! Refreshing list...');
          // Wait a moment before refreshing to ensure database is updated
          setTimeout(async () => {
            await fetchCombos();
            setDeletingComboId(null);
          }, 500);
        } else {
          throw new Error('Unexpected response from server');
        }
      } catch (error) {
        console.error('Delete error:', error);
        console.error('Error response:', error.response);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete combo';
        showError(`Delete failed: ${errorMessage}`);
        setDeletingComboId(null);
      }
    }
  };

  const handleAddItem = (combo) => {
    setSelectedComboForItem(combo);
    setItemProduct('');
    setItemQuantity(1);
    setShowAddItemModal(true);
  };

  const handleCloseAddItemModal = () => {
    setShowAddItemModal(false);
    setSelectedComboForItem(null);
    setItemProduct('');
    setItemQuantity(1);
  };

  const handleSaveItem = async () => {
    if (!itemProduct || itemQuantity < 1) {
      showError('Please select a product and enter valid quantity');
      return;
    }

    const product = products.find(p => p._id === itemProduct);
    if (!product) {
      showError('Selected product not found');
      return;
    }

    // Check if there's enough stock
    if (product.quantity < itemQuantity) {
      showError(`Insufficient stock! Only ${product.quantity} units available, but you're trying to add ${itemQuantity}`);
      return;
    }

    // Check if product is out of stock
    if (product.quantity === 0) {
      showError('Cannot add out-of-stock product to combo');
      return;
    }

    try {
      setLoading(true);
      const response = await combosAPI.addProduct(selectedComboForItem._id, {
        product: itemProduct,
        quantity: itemQuantity
      });
      
      showSuccess('Product added to combo successfully!');
      handleCloseAddItemModal();
      // Force refresh the combos list
      await fetchCombos();
    } catch (error) {
      console.error('Add product error:', error);
      showError(error.response?.data?.message || 'Failed to add product to combo');
    } finally {
      setLoading(false);
    }
  };

  const calculateComboValue = () => {
    return formData.products.reduce((total, item) => {
      return total + ((item.product.sellingPrice || item.product.price) * item.quantity);
    }, 0);
  };

  // Excel Upload Handlers
  const handleShowUploadModal = () => {
    setShowUploadModal(true);
    setUploadFile(null);
    setUploadResult(null);
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadResult(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        setUploadFile(file);
      } else {
        showError('Please select a valid Excel file (.xlsx or .xls)');
        e.target.value = null;
      }
    }
  };

  const handleUploadExcel = async () => {
    if (!uploadFile) {
      showError('Please select a file to upload');
      return;
    }

    try {
      setUploadLoading(true);
      const response = await productMastersAPI.uploadExcel(uploadFile);
      setUploadResult(response.data);
      setEditableData(response.data.processedData || []);
      showSuccess(
        `✅ Processed ${response.data.successCount} records! ` +
        `Categories: ${response.data.categoriesCreated}, ` +
        `New Combos: ${response.data.combosCreated}, ` +
        `Updated: ${response.data.combosUpdated}`
      );
      
      // Refresh data after upload
      await fetchCombos();
    } catch (error) {
      console.error('Upload error:', error);
      showError(error.response?.data?.message || 'Failed to upload Excel file');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleGenerateAllBarcodes = async () => {
    if (!uploadResult?.processedData?.length) {
      showError('No processed data available for barcode generation');
      return;
    }

    try {
      setUploadLoading(true);
      
      // Get all combo IDs from the processed data
      const comboIds = uploadResult.processedData
        .map(item => item.comboId)
        .filter(id => id); // Filter out any undefined IDs
      
      if (comboIds.length === 0) {
        showError('No valid combo IDs found for barcode generation');
        return;
      }

      const response = await barcodesAPI.downloadComboBarcodes(comboIds);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `uploaded-combos-barcodes-${Date.now()}.zip`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showSuccess(`Generated and downloaded ${comboIds.length} barcodes successfully!`);
    } catch (error) {
      console.error('Barcode generation error:', error);
      showError('Failed to generate barcodes for uploaded products');
    } finally {
      setUploadLoading(false);
    }
  };

  // EditableRow component
  const EditableRow = ({ item, index }) => {
    const [localData, setLocalData] = useState({
      sNo: item.sNo || index + 1,
      category: item.category || '',
      comboCode: item.comboCode || '',
      comboName: item.comboName || '',
      price: item.price || 0,
      priceWithGST: item.priceWithGST || (item.price ? (item.price * 1.18) : 0)
    });

    const handleCellEdit = (field, value) => {
      const updatedData = { ...localData, [field]: value };
      if (field === 'price') {
        updatedData.priceWithGST = parseFloat(value) * 1.18;
      }
      setLocalData(updatedData);
    };

    const handleCellClick = (field) => {
      setEditingCell(`${index}-${field}`);
    };

    const handleCellBlur = () => {
      setEditingCell(null);
    };

    const renderEditableCell = (field, value) => {
      const isEditing = editingCell === `${index}-${field}`;
      
      if (isEditing) {
        return (
          <Form.Control
            size="sm"
            type={field === 'price' ? 'number' : 'text'}
            value={value || ''}
            onChange={(e) => handleCellEdit(field, e.target.value)}
            onBlur={handleCellBlur}
            onKeyPress={(e) => e.key === 'Enter' && handleCellBlur()}
            autoFocus
            style={{ minWidth: '100px' }}
          />
        );
      }
      
      const displayValue = field === 'price' || field === 'priceWithGST' 
        ? `₹${parseFloat(value || 0).toFixed(2)}` 
        : String(value || '');
      
      return (
        <span 
          onClick={() => handleCellClick(field)}
          style={{ cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
          className="hover-edit"
        >
          {displayValue}
        </span>
      );
    };

    return (
      <tr>
        <td>{renderEditableCell('sNo', localData.sNo)}</td>
        <td>{renderEditableCell('category', localData.category)}</td>
        <td>
          <Badge bg="info">
            <span>{renderEditableCell('comboCode', localData.comboCode)}</span>
          </Badge>
        </td>
        <td>{renderEditableCell('comboName', localData.comboName)}</td>
        <td>{renderEditableCell('price', localData.price)}</td>
        <td>{renderEditableCell('priceWithGST', localData.priceWithGST)}</td>
      </tr>
    );
  };



  // Checkbox handlers for barcode download
  const handleSelectCombo = (comboId) => {
    setSelectedCombos(prev => 
      prev.includes(comboId) 
        ? prev.filter(id => id !== comboId)
        : [...prev, comboId]
    );
  };

  const handleSelectAllCombos = (checked) => {
    if (checked) {
      setSelectedCombos(filteredCombos.map(combo => combo._id));
    } else {
      setSelectedCombos([]);
    }
  };

  const handleDownloadBarcodes = async () => {
    if (selectedCombos.length === 0) {
      showError('Please select at least one combo');
      return;
    }

    try {
      setIsDownloadingBarcodes(true);
      const response = await barcodesAPI.downloadComboBarcodes(selectedCombos);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      if (selectedCombos.length === 1) {
        const combo = combos.find(c => c._id === selectedCombos[0]);
        link.setAttribute('download', `barcode-${combo?.barcode || 'combo'}.png`);
      } else {
        link.setAttribute('download', `combo-barcodes-${Date.now()}.zip`);
      }
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showSuccess(`Downloaded ${selectedCombos.length} barcode(s) successfully!`);
      setSelectedCombos([]);
    } catch (error) {
      console.error('Download error:', error);
      showError('Failed to download barcodes');
    } finally {
      setIsDownloadingBarcodes(false);
    }
  };

  // Filter combos based on search query
  const filteredCombos = combos.filter(combo => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const name = combo.name?.toLowerCase() || '';
    const barcode = combo.barcode?.toLowerCase() || '';
    const description = combo.description?.toLowerCase() || '';
    const category = typeof combo.category === 'object' 
      ? combo.category.name?.toLowerCase() || '' 
      : combo.category?.toLowerCase() || '';
    
    return name.includes(query) || 
           barcode.includes(query) || 
           description.includes(query) ||
           category.includes(query);
  });

  return (
    <Box sx={{ p: 3, bgcolor: '#fff', minHeight: '100vh' }}>
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs>
            <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', mb: 1 }}>
              <span style={{ fontSize: '2rem', marginRight: '1rem' }}>📦</span>
              Combo Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage product combinations and bundles
            </Typography>
          </Grid>
          <Grid item xs="auto">
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {selectedCombos.length > 0 && (
                <Button
                  variant="outlined"
                  onClick={handleDownloadBarcodes}
                  disabled={isDownloadingBarcodes}
                  startIcon={isDownloadingBarcodes ? <CircularProgress size={16} /> : <DownloadIcon />}
                  sx={{ 
                    color: '#000', 
                    borderColor: '#000',
                    '&:hover': { borderColor: '#333', bgcolor: 'rgba(0,0,0,0.04)' }
                  }}
                >
                  {isDownloadingBarcodes ? 'Downloading...' : `Download Barcodes (${selectedCombos.length})`}
                </Button>
              )}
              <Button
                variant="outlined"
                onClick={handleShowUploadModal}
                startIcon={<FileUploadIcon />}
                sx={{ 
                  color: '#000', 
                  borderColor: '#000',
                  '&:hover': { borderColor: '#333', bgcolor: 'rgba(0,0,0,0.04)' }
                }}
              >
                Upload Excel
              </Button>
              <Button
                variant="contained"
                onClick={handleShowModal}
                startIcon={<AddIcon />}
                sx={{ 
                  bgcolor: '#000',
                  '&:hover': { bgcolor: '#333' }
                }}
              >
                Add New Combo
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
        <TextField
          fullWidth
          placeholder="🔍 Search combos by name, barcode, category, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': { borderColor: '#D4AF37' },
              '&.Mui-focused fieldset': { borderColor: '#D4AF37' }
            }
          }}
          InputProps={{
            endAdornment: searchQuery && (
              <IconButton
                size="small"
                onClick={() => setSearchQuery('')}
                sx={{ color: '#666' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )
          }}
        />
        {searchQuery && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Found {filteredCombos.length} combo(s) matching "{searchQuery}"
          </Typography>
        )}
      </Paper>

      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Snackbar
          key={toast.id}
          open={toast.show}
          autoHideDuration={6000}
          onClose={() => removeToast(toast.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => removeToast(toast.id)} 
            severity={toast.variant === 'success' ? 'success' : 'error'}
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}

      {loading && combos.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress sx={{ color: '#000' }} />
        </Box>
      ) : (
        <TableContainer 
          component={Paper} 
          sx={{ 
            border: '1px solid #e0e0e0', 
            boxShadow: 'none',
            maxHeight: 600,
            '&::-webkit-scrollbar': { width: '8px', height: '8px' },
            '&::-webkit-scrollbar-track': { background: '#f1f1f1' },
            '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb:hover': { background: '#555' }
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#D4AF37', color: '#000' }}>
                  <Checkbox
                    checked={filteredCombos.length > 0 && selectedCombos.length === filteredCombos.length}
                    indeterminate={selectedCombos.length > 0 && selectedCombos.length < filteredCombos.length}
                    onChange={(e) => handleSelectAllCombos(e.target.checked)}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#D4AF37', color: '#000' }}>Image</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#D4AF37', color: '#000' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#D4AF37', color: '#000' }}>Barcode</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#D4AF37', color: '#000' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#D4AF37', color: '#000' }}>Products</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#D4AF37', color: '#000' }}>Available</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#D4AF37', color: '#000' }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#D4AF37', color: '#000' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCombos.map((combo) => (
                <TableRow key={combo._id} hover sx={{ '&:hover': { bgcolor: '#F4E3B2' } }}>
                  <TableCell>
                    <Checkbox
                      checked={selectedCombos.includes(combo._id)}
                      onChange={() => handleSelectCombo(combo._id)}
                    />
                  </TableCell>
                  <TableCell>
                    {combo.imageUrl ? (
                      <img
                        src={combo.imageUrl}
                        alt={combo.name}
                        style={{
                          width: '50px',
                          height: '50px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleImageClick(combo.imageUrl, combo.name)}
                      />
                    ) : (
                      <Box
                        onClick={() => handleImageClick(null, combo.name)}
                        sx={{
                          width: '50px',
                          height: '50px',
                          bgcolor: '#f8f9fa',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        📦
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {combo.name}
                      </Typography>
                      {combo.description && (
                        <Typography variant="caption" color="text.secondary">
                          {combo.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={combo.barcode} color="info" size="small" />
                  </TableCell>
                  <TableCell>
                    {combo.category ? (
                      <Chip 
                        label={typeof combo.category === 'object' ? combo.category.name : combo.category}
                        size="small"
                        sx={{ bgcolor: '#6c757d', color: '#fff' }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip 
                        label={`${combo.products?.length || 0} items`}
                        color="info"
                        size="small"
                      />
                      {combo.productDetails && combo.productDetails.some(p => p.stockStatus === 'insufficient' || p.stockStatus === 'out-of-stock') && (
                        <Chip 
                          label="⚠️ Stock Issues"
                          color="warning"
                          size="small"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip 
                        label={`${combo.availableCount || 0} available`}
                        color={combo.availableCount > 0 ? 'success' : 'error'}
                        size="small"
                      />
                      {combo.productDetails && (
                        <Typography variant="caption" color="text.secondary">
                          {combo.productDetails.filter(p => p.stockStatus === 'available').length}/{combo.productDetails.length} products OK
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                      ₹{combo.price?.toFixed(2) || '0.00'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Selling Price
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        onClick={() => handleAddItem(combo)}
                        startIcon={<AddIcon />}
                        variant="outlined"
                        sx={{ color: '#000', borderColor: '#000', minWidth: 'auto' }}
                      >
                        Add Item
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleView(combo)}
                        sx={{ color: '#000' }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(combo)}
                        sx={{ color: '#000' }}
                        disabled={deletingComboId === combo._id}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(combo._id)}
                        sx={{ color: '#d32f2f' }}
                        disabled={deletingComboId !== null}
                      >
                        {deletingComboId === combo._id ? (
                          <CircularProgress size={20} sx={{ color: '#d32f2f' }} />
                        ) : (
                          <DeleteIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* No Results Message */}
      {!loading && filteredCombos.length === 0 && searchQuery && (
        <Paper sx={{ p: 4, textAlign: 'center', border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No combos found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No combos match your search "{searchQuery}". Try a different search term.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setSearchQuery('')}
            sx={{ mt: 2, color: '#000', borderColor: '#000' }}
          >
            Clear Search
          </Button>
        </Paper>
      )}

      {/* Add/Edit Combo Modal */}
      <Dialog 
        open={showModal} 
        onClose={handleCloseModal}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#000', color: '#fff' }}>
          {editMode ? '✏️ Edit Combo' : 'Add New Combo'}
          <IconButton
            onClick={handleCloseModal}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#fff' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Combo Name "
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter combo name"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Barcode "
                value={formData.barcode}
                onChange={(e) => handleInputChange('barcode', e.target.value)}
                placeholder="Enter barcode (e.g., EW00L002)"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ minWidth: "280px" }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">Select a category...</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter combo description"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Auto-Calculated Price *"
                type="text"
                value={`₹${calculateComboValue().toFixed(2)}`}
                disabled
                InputProps={{
                  sx: { 
                    bgcolor: '#e9ecef',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    color: '#2e7d32'
                  }
                }}
                helperText="Price is automatically calculated based on selected products"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Combo Image"
                type="file"
                onChange={handleImageChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{ accept: "image/*" }}
              />
            </Grid>
          </Grid>

          <Box sx={{ borderTop: '1px solid #e0e0e0', my: 3 }} />

          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            📋 Products in Combo
          </Typography>

          {/* Add Product Section */}
          <Paper sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              ➕ Add Product to Combo
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ minWidth: "280px" }}>
                  <InputLabel>Select Product</InputLabel>
                  <Select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    label="Select Product"
                  >
                    <MenuItem value="">Choose a product...</MenuItem>
                    {products.map(product => {
                      const stockStatus = product.quantity === 0 ? ' - OUT OF STOCK' : 
                                        product.quantity < 10 ? ' - LOW STOCK' : '';
                      return (
                        <MenuItem 
                          key={product._id} 
                          value={product._id}
                          disabled={product.quantity === 0}
                        >
                          {product.name} - ₹{product.price} (Available: {product.quantity}){stockStatus}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  {selectedProduct && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {(() => {
                        const selectedProd = products.find(p => p._id === selectedProduct);
                        if (!selectedProd) return '';
                        return selectedProd.quantity === 0 ? '❌ This product is out of stock' :
                               selectedProd.quantity < 10 ? `⚠️ Low stock warning: Only ${selectedProd.quantity} units available` :
                               `✅ ${selectedProd.quantity} units available in stock`;
                      })()} 
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  inputProps={{
                    min: 1,
                    max: selectedProduct ? products.find(p => p._id === selectedProduct)?.quantity || 1 : undefined
                  }}
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                  helperText={selectedProduct && productQuantity > 0 ? (() => {
                    const selectedProd = products.find(p => p._id === selectedProduct);
                    if (!selectedProd) return '';
                    const remaining = selectedProd.quantity - productQuantity;
                    return remaining >= 0 ? 
                      `After adding: ${remaining} units will remain in stock` :
                      `⚠️ Warning: Not enough stock! Need ${Math.abs(remaining)} more units`;
                  })() : ''}
                />
              </Grid>
              <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAddProduct}
                  startIcon={<AddIcon />}
                  sx={{ 
                    bgcolor: '#000',
                    '&:hover': { bgcolor: '#333' }
                  }}
                >
                  Add
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Selected Products List */}
          {formData.products.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                📦 Selected Products ({formData.products.length})
              </Typography>
              
              <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#D4AF37' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#000' }}>Product</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#000' }}>Unit Price</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#000' }}>Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#000' }}>Total</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#000' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.products.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.product.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Barcode: {item.product.barcode}
                            </Typography>
                            <br />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: item.product.quantity >= item.quantity ? '#2e7d32' : '#d32f2f'
                              }}
                            >
                              Stock: {item.product.quantity}
                              {item.product.quantity < item.quantity && ' ⚠️ Insufficient!'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>₹{(item.product.sellingPrice || item.product.price)?.toFixed(2)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleUpdateProductQuantity(index, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              sx={{ minWidth: '30px', p: 0.5 }}
                            >
                              -
                            </Button>
                            <Typography sx={{ fontWeight: 600, minWidth: '30px', textAlign: 'center' }}>
                              {item.quantity}
                            </Typography>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleUpdateProductQuantity(index, item.quantity + 1)}
                              sx={{ minWidth: '30px', p: 0.5 }}
                            >
                              +
                            </Button>
                          </Box>
                        </TableCell>
                        <TableCell>₹{((item.product.sellingPrice || item.product.price) * item.quantity).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={() => handleRemoveProduct(index)}
                            startIcon={<DeleteIcon />}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                      <TableCell colSpan={3} sx={{ fontWeight: 600 }}>
                        Total Product Value:
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        ₹{calculateComboValue().toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {calculateComboValue() > 0 && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    💰 Combo Total Value:
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 700 }}>
                    ₹{calculateComboValue().toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    This is the total price customers will pay for this combo package.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={handleCloseModal} sx={{ color: '#000' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading}
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : null}
            sx={{ 
              bgcolor: '#000',
              '&:hover': { bgcolor: '#333' }
            }}
          >
            {editMode ? 'Update Combo' : 'Create Combo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Combo Modal */}
      <Dialog 
        open={showViewModal} 
        onClose={() => setShowViewModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#000', color: '#fff' }}>
          📦 Combo Details
          <IconButton
            onClick={() => setShowViewModal(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#fff' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedCombo && (
            <Box>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                  {selectedCombo.imageUrl ? (
                    <img
                      src={selectedCombo.imageUrl}
                      alt={selectedCombo.name}
                      style={{ 
                        width: '100%',
                        maxHeight: '200px',
                        objectFit: 'contain',
                        borderRadius: '8px'
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        bgcolor: '#f5f5f5',
                        borderRadius: '8px',
                        height: '200px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography sx={{ fontSize: '4rem' }}>📦</Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    {selectedCombo.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {selectedCombo.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      label={`Barcode: ${selectedCombo.barcode}`}
                      color="info"
                    />
                    <Chip 
                      label={`Price: ₹${selectedCombo.price?.toFixed(2)}`}
                      sx={{ bgcolor: '#2e7d32', color: '#fff' }}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                📋 Products in this Combo
              </Typography>
              {selectedCombo.products && selectedCombo.products.length > 0 ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={selectedCombo.availableCount > 0 
                        ? `✅ ${selectedCombo.availableCount} combos can be made` 
                        : '❌ Cannot make combo - insufficient stock'
                      }
                      color={selectedCombo.availableCount > 0 ? 'success' : 'error'}
                    />
                  </Box>
                  <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#D4AF37' }}>
                          <TableCell sx={{ fontWeight: 600, color: '#000' }}>Product Name</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#000' }}>Barcode</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#000' }}>Unit Price</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#000' }}>Required Qty</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#000' }}>Available Stock</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#000' }}>Can Make</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#000' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#000' }}>Total Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(selectedCombo.productDetails || selectedCombo.products).map((item, index) => {
                          const productDetail = selectedCombo.productDetails ? item : {
                            ...item,
                            availableStock: item.product?.quantity || 0,
                            canMake: item.product?.quantity ? Math.floor(item.product.quantity / item.quantity) : 0,
                            stockStatus: !item.product?.quantity ? 'out-of-stock' : 
                                       item.product.quantity < item.quantity ? 'insufficient' : 'available'
                          };
                          
                          const getStatusChip = (status) => {
                            switch(status) {
                              case 'available': return <Chip label="✅ Available" color="success" size="small" />;
                              case 'insufficient': return <Chip label="⚠️ Low Stock" color="warning" size="small" />;
                              case 'out-of-stock': return <Chip label="❌ Out of Stock" color="error" size="small" />;
                              case 'unavailable': return <Chip label="❓ Unavailable" size="small" sx={{ bgcolor: '#6c757d', color: '#fff' }} />;
                              default: return <Chip label="Unknown" size="small" sx={{ bgcolor: '#6c757d', color: '#fff' }} />;
                            }
                          };

                          const rowBgColor = productDetail.stockStatus === 'out-of-stock' ? '#ffebee' : 
                                           productDetail.stockStatus === 'insufficient' ? '#fff3e0' : 'inherit';
                          
                          return (
                            <TableRow key={index} sx={{ bgcolor: rowBgColor }}>
                              <TableCell>{productDetail.product?.name || 'N/A'}</TableCell>
                              <TableCell>
                                <Chip label={productDetail.product?.barcode || 'N/A'} color="info" size="small" />
                              </TableCell>
                              <TableCell>₹{productDetail.product?.price?.toFixed(2) || '0.00'}</TableCell>
                              <TableCell>
                                <Chip label={productDetail.quantity} color="primary" size="small" />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={productDetail.availableStock}
                                  color={productDetail.availableStock > 0 ? 'success' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={`${productDetail.canMake} combos`}
                                  color={productDetail.canMake > 0 ? 'success' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{getStatusChip(productDetail.stockStatus)}</TableCell>
                              <TableCell>₹{((productDetail.product?.price || 0) * productDetail.quantity).toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                          <TableCell colSpan={7} sx={{ fontWeight: 600 }}>
                            Total Combo Value:
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            ₹{selectedCombo.price?.toFixed(2) || '0.00'}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <Alert severity="info">No products found in this combo.</Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={() => setShowViewModal(false)}
            sx={{ color: '#000' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Excel Upload Modal */}
      <Dialog 
        open={showUploadModal} 
        onClose={handleCloseUploadModal}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#000', color: '#fff' }}>
          📤 Upload Product Master Excel File
          <IconButton
            onClick={handleCloseUploadModal}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#fff' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              📋 Excel File Processing:
            </Typography>
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li><strong>Product Category</strong> → Stored in <Chip label="Category DB" size="small" sx={{ bgcolor: '#6c757d', color: '#fff' }} /></li>
              <li><strong>Selling Product Code, Product Name, Price</strong> → Stored in <Chip label="Combo DB" color="primary" size="small" /></li>
              <li>✅ Category & Combo are <strong>automatically mapped</strong></li>
              <li>⏳ Products remain <strong>unmapped</strong> (manual mapping required)</li>
            </ul>
            <Box sx={{ borderTop: '1px solid #e0e0e0', my: 1, pt: 1 }}>
              <Typography variant="body2">
                <strong>Required Columns:</strong> <code>S.No.</code>, <code>Product Category</code>, 
                <code>Selling Product Code</code>, <code>Product Name</code>, <code>Price/product</code>
              </Typography>
            </Box>
          </Alert>

          <TextField
            fullWidth
            type="file"
            label="Select Excel File (.xlsx or .xls)"
            InputLabelProps={{ shrink: true }}
            inputProps={{ accept: ".xlsx,.xls" }}
            onChange={handleFileChange}
            disabled={uploadLoading}
            helperText={uploadFile ? `✅ Selected: ${uploadFile.name}` : ''}
          />

          {uploadResult && (
            <Box sx={{ mt: 3 }}>
              <Alert severity={uploadResult.errorCount > 0 ? 'warning' : 'success'}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  📊 Upload Results
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      <li><strong>Total Rows:</strong> {uploadResult.totalRows}</li>
                      <li><strong>Success:</strong> {uploadResult.successCount}</li>
                      <li><strong>Errors:</strong> {uploadResult.errorCount}</li>
                    </ul>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      <li><strong>Categories Created:</strong> {uploadResult.categoriesCreated}</li>
                      <li><strong>Combos Created:</strong> {uploadResult.combosCreated}</li>
                      <li><strong>Combos Updated:</strong> {uploadResult.combosUpdated}</li>
                    </ul>
                  </Grid>
                </Grid>
              </Alert>

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <Paper sx={{ mt: 2, border: '1px solid #d32f2f' }}>
                  <Box sx={{ bgcolor: '#d32f2f', color: '#fff', p: 1.5 }}>
                    <Typography variant="subtitle2">
                      ❌ Errors ({uploadResult.errors.length})
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, maxHeight: '200px', overflowY: 'auto' }}>
                    {uploadResult.errors.map((err, idx) => (
                      <Typography key={idx} variant="body2" sx={{ mb: 1 }}>
                        <strong>Row {err.row}:</strong> {err.error}
                      </Typography>
                    ))}
                  </Box>
                </Paper>
              )}

              {uploadResult.processedData && uploadResult.processedData.length > 0 && (
                <Paper sx={{ mt: 2, border: '1px solid #2e7d32' }}>
                  <Box sx={{ 
                    bgcolor: '#2e7d32', 
                    color: '#fff', 
                    p: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Typography variant="subtitle2">
                      ✅ Successfully Processed ({uploadResult.processedData.length})
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleGenerateAllBarcodes}
                        disabled={uploadLoading}
                        startIcon={uploadLoading ? <CircularProgress size={16} /> : null}
                        sx={{ 
                          bgcolor: '#fff',
                          color: '#2e7d32',
                          '&:hover': { bgcolor: '#f5f5f5' }
                        }}
                      >
                        {uploadLoading ? 'Generating...' : '📊 Generate All Barcodes'}
                      </Button>
                      <Typography variant="caption">
                        Click on any cell to edit
                      </Typography>
                    </Box>
                  </Box>
                  <TableContainer sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#D4AF37' }}>
                          <TableCell sx={{ fontWeight: 600, color: '#000' }}>S.No.</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#000' }}>Product Category</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#000' }}>Selling Product Code</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#000' }}>Product Name</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#000' }}>Price/product</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#000' }}>Price/product with GST</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {uploadResult.processedData.map((item, idx) => (
                          <EditableRow key={idx} item={item} index={idx} />
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={handleCloseUploadModal}
            disabled={uploadLoading}
            sx={{ color: '#000' }}
          >
            Close
          </Button>
          <Button 
            onClick={handleUploadExcel}
            disabled={!uploadFile || uploadLoading}
            variant="contained"
            startIcon={uploadLoading ? <CircularProgress size={16} /> : <FileUploadIcon />}
            sx={{ 
              bgcolor: '#000',
              '&:hover': { bgcolor: '#333' }
            }}
          >
            {uploadLoading ? 'Uploading...' : 'Upload & Process'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Item Modal */}
      <Dialog 
        open={showAddItemModal} 
        onClose={handleCloseAddItemModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#000', color: '#fff' }}>
          ➕ Add Product to Combo
          <IconButton
            onClick={handleCloseAddItemModal}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#fff' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedComboForItem && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Adding to: <strong>{selectedComboForItem.name}</strong>
                </Typography>
                <Chip label={selectedComboForItem.barcode} color="info" size="small" />
              </Box>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Product</InputLabel>
                <Select
                  value={itemProduct}
                  onChange={(e) => setItemProduct(e.target.value)}
                  label="Select Product"
                >
                  <MenuItem value="">Choose a product...</MenuItem>
                  {products.map(product => {
                    const stockStatus = product.quantity === 0 ? ' - OUT OF STOCK' : 
                                      product.quantity < 10 ? ' - LOW STOCK' : '';
                    return (
                      <MenuItem 
                        key={product._id} 
                        value={product._id}
                        disabled={product.quantity === 0}
                      >
                        {product.name} - ₹{product.price} (Available: {product.quantity}){stockStatus}
                      </MenuItem>
                    );
                  })}
                </Select>
                {itemProduct && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {(() => {
                      const selectedProd = products.find(p => p._id === itemProduct);
                      if (!selectedProd) return '';
                      return selectedProd.quantity === 0 ? '❌ This product is out of stock' :
                             selectedProd.quantity < 10 ? `⚠️ Low stock warning: Only ${selectedProd.quantity} units available` :
                             `✅ ${selectedProd.quantity} units available in stock`;
                    })()} 
                  </Typography>
                )}
              </FormControl>
              
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                inputProps={{
                  min: 1,
                  max: itemProduct ? products.find(p => p._id === itemProduct)?.quantity || 1 : undefined
                }}
                value={itemQuantity}
                onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                helperText={itemProduct && itemQuantity > 0 ? (() => {
                  const selectedProd = products.find(p => p._id === itemProduct);
                  if (!selectedProd) return '';
                  const remaining = selectedProd.quantity - itemQuantity;
                  return remaining >= 0 ? 
                    `After adding: ${remaining} units will remain in stock` :
                    `⚠️ Warning: Not enough stock! Need ${Math.abs(remaining)} more units`;
                })() : ''}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={handleCloseAddItemModal}
            sx={{ color: '#000' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveItem}
            disabled={loading}
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <AddIcon />}
            sx={{ 
              bgcolor: '#000',
              '&:hover': { bgcolor: '#333' }
            }}
          >
            Add Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog 
        open={imagePreviewModal} 
        onClose={handleCloseImagePreview} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}
      >
        <IconButton
          onClick={handleCloseImagePreview}
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            bgcolor: 'rgba(255,255,255,0.2)',
            color: '#fff',
            zIndex: 1,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'rgba(0,0,0,0.9)',
          p: 2
        }}>
          {previewImageUrl ? (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                {previewImageName}
              </Typography>
              <img 
                src={previewImageUrl} 
                alt={previewImageName} 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '80vh', 
                  objectFit: 'contain',
                  borderRadius: '8px'
                }} 
              />
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h4" sx={{ color: '#fff', mb: 2 }}>📦</Typography>
              <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                No Image Available
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {previewImageName}
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Combos;
