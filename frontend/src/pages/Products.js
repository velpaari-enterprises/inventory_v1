import React, { useState, useEffect, useRef } from 'react';
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
  IconButton,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  LinearProgress,
  Card,
  CardMedia,
  InputAdornment,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  CameraAlt as CameraIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { productsAPI, vendorsAPI, returnsAPI, categoriesAPI, barcodesAPI, combosAPI } from '../services/api';
import Quagga from 'quagga';

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

import {
  ModalOverlay,
  ModalContainer,
  ModalHeader,
  ModalTitle,
  CloseButton as StyledCloseButton,
  ModalBody,
  FormGrid,
  FormGroup,
  Label,
  Input,
  TextArea,
  Select as StyledSelect,
  ModalFooter,
  SecondaryButton,
  PrimaryButton,
  ScannerContainer,
  ScannerButton,
  ScannerStatus,
  ActionButton as StyledActionButton
} from './Products/Productscss';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    minquantity: '',
    quantity: '',
    vendor: '',
    photo: null,
    imagePreview: '',
    deleteImage: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [barcodeFilter, setBarcodeFilter] = useState('');
  const [showRTOModal, setShowRTOModal] = useState(false);
  const [rtoFormData, setRTOFormData] = useState({
    category: 'RTO', // Fixed category for RTO
    returnDate: new Date().toISOString().split('T')[0],
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    reason: 'not_satisfied',
    items: [],
    totalAmount: 0,
    comments: '',
    status: 'processed' // Default status
  });
  const [rtoScannerActive, setRTOScannerActive] = useState(false);
  const [rtoScannedCode, setRTOScannedCode] = useState('');
  const [rtoBarcodeMode, setRTOBarcodeMode] = useState(false);
  
  const rtoScannerRef = useRef(null);
  const rtoBarcodeInputRef = useRef(null);

  // RPU States
  const [showRPUModal, setShowRPUModal] = useState(false);
  const [rpuFormData, setRPUFormData] = useState({
    category: 'RPU', // Fixed category for RPU
    returnDate: new Date().toISOString().split('T')[0],
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    reason: 'not_satisfied',
    items: [],
    totalAmount: 0,
    comments: '',
    status: 'processed' // Default status
  });
  const [rpuScannerActive, setRPUScannerActive] = useState(false);
  const [rpuScannedCode, setRPUScannedCode] = useState('');
  const [rpuBarcodeMode, setRPUBarcodeMode] = useState(false);
  
  const rpuScannerRef = useRef(null);
  const rpuBarcodeInputRef = useRef(null);

  // Image Preview Modal
  const [imagePreviewModal, setImagePreviewModal] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [previewImageName, setPreviewImageName] = useState('');

  const handleImageClick = (imageUrl, productName) => {
    if (imageUrl) {
      setPreviewImageUrl(imageUrl);
      setPreviewImageName(productName);
      setImagePreviewModal(true);
    }
  };

  const handleCloseImagePreview = () => {
    setImagePreviewModal(false);
    setPreviewImageUrl('');
    setPreviewImageName('');
  };

  useEffect(() => {
    fetchProducts();
    fetchVendors();
    fetchCategories();
  }, []);
  
  // Cleanup scanner on component unmount
  useEffect(() => {
    return () => {
      stopRTOScanner();
      stopRPUScanner();
    };
  }, []);

  // Effect to handle select all checkbox state
  useEffect(() => {
    if (selectAll) {
      setSelectedProducts(products.map(product => product._id));
    } else {
      setSelectedProducts([]);
    }
  }, [selectAll, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      setProducts(response.data);
      setError('');
    } catch (error) {
      setError('Failed to fetch products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await vendorsAPI.getAll();
      setVendors(response.data);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleShowModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.category?._id || '',
        costPrice: product.costPrice || product.price || '',
        sellingPrice: product.sellingPrice || product.price || '',
        minquantity: product.minquantity,
        quantity: product.quantity,
        vendor: product.vendor?._id || '',
        photo: null,
        imagePreview: product.image || '',
        deleteImage: false
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        costPrice: '',
        sellingPrice: '',
        minquantity: '',
        quantity: '',
        vendor: '',
        photo: null,
        imagePreview: '',
        deleteImage: false
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        setError('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      setFormData(prev => ({
        ...prev,
        photo: file,
        imagePreview: previewUrl,
        deleteImage: false // Reset delete flag when new file is selected
      }));
      
      setError('');
    }
  };

  const removeImage = () => {
    // Cleanup preview URL to prevent memory leaks
    if (formData.imagePreview && formData.imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    
    setFormData(prev => ({
      ...prev,
      imagePreview: '',
      photo: null,
      deleteImage: true // Signal that the image should be deleted
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        minquantity: parseInt(formData.minquantity),
        quantity: parseInt(formData.quantity),
        vendor: formData.vendor,
        photo: formData.photo, // Include the file for upload
        deleteImage: formData.deleteImage // Include delete flag for image removal
      };

      if (editingProduct) {
        await productsAPI.update(editingProduct._id, productData);
        setSuccess('Product updated successfully!');
      } else {
        await productsAPI.create(productData);
        setSuccess('Product created successfully!');
      }
      fetchProducts();
      handleCloseModal();
    } catch (error) {
      setError('Failed to save product. Please try again.');
      console.error('Submit error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(id);
        setSuccess('Product deleted successfully!');
        fetchProducts();
      } catch (error) {
        setError('Failed to delete product. Please try again.');
      }
    }
  };

  const clearAlerts = () => {
    setError('');
    setSuccess('');
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

  const openImagePreview = (imageUrl) => {
    setImagePreview(imageUrl);
  };

  const closeImagePreview = () => {
    setImagePreview(null);
  };

  // Handle individual checkbox selection
  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        // If already selected, remove it
        const newSelected = prev.filter(id => id !== productId);
        // Update selectAll state
        if (newSelected.length === 0) {
          setSelectAll(false);
        }
        return newSelected;
      } else {
        // If not selected, add it
        const newSelected = [...prev, productId];
        // Check if all products are now selected
        if (newSelected.length === products.length) {
          setSelectAll(true);
        }
        return newSelected;
      }
    });
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    setSelectAll(!selectAll);
  };

  // Handle batch delete of selected products
  const handleBatchDelete = async () => {
    if (selectedProducts.length === 0) {
      setError('No products selected for deletion');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} selected products?`)) {
      try {
        // Perform multiple delete operations
        const promises = selectedProducts.map(id => productsAPI.delete(id));
        await Promise.all(promises);
        
        setSuccess(`${selectedProducts.length} products deleted successfully!`);
        setSelectedProducts([]);
        setSelectAll(false);
        fetchProducts();
      } catch (error) {
        setError('Failed to delete selected products. Please try again.');
      }
    }
  };

  // Handle batch barcode download
  const handleBatchBarcodeDownload = async () => {
    if (selectedProducts.length === 0) {
      setError('No products selected for barcode download');
      return;
    }

    try {
      setLoading(true);
      const response = await barcodesAPI.downloadProductBarcodes(selectedProducts);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      if (selectedProducts.length === 1) {
        const product = products.find(p => p._id === selectedProducts[0]);
        link.setAttribute('download', `barcode-${product?.barcode || 'product'}.png`);
      } else {
        link.setAttribute('download', `product-barcodes-${Date.now()}.zip`);
      }
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess(`Downloaded ${selectedProducts.length} barcode(s) successfully!`);
      setSelectedProducts([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download barcodes. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter products by barcode or product name
  const filterProductsByBarcode = () => {
    if (!barcodeFilter) return products;
    
    const searchTerm = barcodeFilter.toLowerCase();
    return products.filter(product => 
      (product.barcode && product.barcode.toLowerCase().includes(searchTerm)) ||
      (product.name && product.name.toLowerCase().includes(searchTerm))
    );
  };

  // Handle barcode scan (can be connected to a real scanner via input event)
  const handleBarcodeInput = (e) => {
    setBarcodeFilter(e.target.value);
  };

  const ProductImage = ({ product }) => {
    if (product.image) {
      return (
        <img 
          src={product.image} 
          alt={product.name}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            objectFit: 'cover',
            cursor: 'pointer'
          }}
          onClick={() => handleImageClick(product.image, product.name)}
        />
      );
    }

    return (
      <Box 
        onClick={() => handleImageClick(null, product.name)}
        sx={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #3498db, #2980b9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        {product.name.charAt(0)}
      </Box>
    );
  };

  // Function to handle barcode download (fetch as blob for cross-browser support)
  const downloadBarcode = async (barcode, productName) => {
    if (!barcode) return;
    try {
      const response = await productsAPI.getBarcodeImage(barcode);
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `barcode-${barcode}-${productName.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download barcode image.');
    }
  };

  // RTO Form Functions
  const handleRTOInputChange = (name, value) => {
    setRTOFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateRTOTotal = () => {
    return rtoFormData.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  };

  const handleRTOItemChange = (index, field, value) => {
    const newItems = [...rtoFormData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    
    setRTOFormData(prev => ({
      ...prev,
      items: newItems,
      totalAmount
    }));
  };

  const handleAddRTOItem = () => {
    setRTOFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product: '',
        productName: '',
        barcode: '',
        quantity: 1,
        unitPrice: 0,
        total: 0
      }]
    }));
  };

  const handleRemoveRTOItem = (index) => {
    const newItems = rtoFormData.items.filter((_, i) => i !== index);
    const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    
    setRTOFormData(prev => ({
      ...prev,
      items: newItems,
      totalAmount
    }));
  };

  const handleRTOProductSelect = (index, productId) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      const newItems = [...rtoFormData.items];
      newItems[index] = {
        ...newItems[index],
        product: product._id,
        productName: product.name,
        barcode: product.barcode || '',
        unitPrice: product.price
      };
      
      const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      
      setRTOFormData(prev => ({
        ...prev,
        items: newItems,
        totalAmount
      }));
    }
  };

  const handleRTOSubmit = async (e) => {
    e.preventDefault();
    
    if (!rtoFormData.customerName || rtoFormData.items.length === 0) {
      setError('Customer name and at least one item are required');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!rtoFormData.reason || !['not_satisfied', 'wrong_item'].includes(rtoFormData.reason)) {
      setError('Please select a valid return reason');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setLoading(true);
      
      // Prepare the return data for API
      const returnData = {
        category: 'RTO',
        returnDate: rtoFormData.returnDate,
        customerName: rtoFormData.customerName,
        customerPhone: rtoFormData.customerPhone,
        customerEmail: rtoFormData.customerEmail,
        reason: rtoFormData.reason,
        items: rtoFormData.items.map(item => ({
          product: item.product,
          productName: item.productName,
          barcode: item.barcode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity
        })),
        totalAmount: rtoFormData.totalAmount,
        comments: rtoFormData.comments,
        status: 'processed'
      };
      
      // Create the return record
      const response = await returnsAPI.create(returnData);
      
      if (response.data) {
        const returnId = response.data.returnId || response.data.return?.returnId || response.data._id;
        setSuccess(`RTO processed successfully! Return ID: ${returnId}. Product quantities have been updated. Check Returns & Tracking page to view details.`);
        
        // Refresh the products list to show updated quantities
        await fetchProducts();
        
        // Reset form and close modal
        setRTOFormData({
          category: 'RTO',
          returnDate: new Date().toISOString().split('T')[0],
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          reason: 'not_satisfied',
          items: [],
          totalAmount: 0,
          comments: '',
          status: 'processed'
        });
        setShowRTOModal(false);
        
        // Clear success message after 8 seconds to give user time to read
        setTimeout(() => setSuccess(''), 8000);
      }
    } catch (error) {
      console.error('RTO Submission Error:', error);
      setError(error.response?.data?.message || 'Failed to process RTO. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRTOModal = () => {
    stopRTOScanner(); // Stop scanner when closing modal
    setShowRTOModal(false);
    setRTOFormData({
      category: 'RTO',
      returnDate: new Date().toISOString().split('T')[0],
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      reason: 'not_satisfied',
      items: [],
      totalAmount: 0,
      comments: '',
      status: 'processed'
    });
    setRTOScannedCode('');
    setRTOBarcodeMode(false);
  };

  // RTO Scanner Functions
  const startRTOScanner = () => {
    if (rtoScannerRef.current) {
      Quagga.init(
        {
          inputStream: {
            type: "LiveStream",
            target: rtoScannerRef.current,
            constraints: {
              facingMode: "environment",
            },
          },
          decoder: {
            readers: [
              "code_128_reader",
              "ean_reader",
              "upc_reader",
              "code_39_reader",
            ],
          },
        },
        (err) => {
          if (err) {
            setError("Unable to start RTO scanner: " + err);
            return;
          }
          Quagga.start();
          setRTOScannerActive(true);
        }
      );

      Quagga.onDetected((data) => {
        if (data && data.codeResult && data.codeResult.code) {
          setRTOScannedCode(data.codeResult.code);
        }
      });
    }
  };

  const stopRTOScanner = () => {
    try {
      Quagga.stop();
      setRTOScannerActive(false);
    } catch (error) {
      // Ignore errors when stopping scanner
    }
  };

  const toggleRTOBarcodeMode = () => {
    setRTOBarcodeMode(prev => {
      const newMode = !prev;
      if (newMode) {
        setTimeout(() => {
          if (rtoBarcodeInputRef.current) {
            rtoBarcodeInputRef.current.focus();
          }
        }, 100);
      } else {
        setRTOScannedCode("");
      }
      return newMode;
    });
  };

  const addRTOBarcodeManually = async () => {
    if (!rtoScannedCode || !rtoBarcodeMode) return;
    
    try {
      await addRTOScannedItem();
      setRTOScannedCode("");
    } catch (error) {
      console.error("Error adding barcode manually:", error);
    }
  };

  const addRTOScannedItem = async () => {
    if (!rtoScannedCode) return;
    
    try {
      // Find product by barcode in the products list
      const productMatch = products.find(p => p.barcode === rtoScannedCode);
      
      if (productMatch) {
        // Check if this barcode already exists in RTO items
        const existingItemIndex = rtoFormData.items.findIndex(item => item.barcode === rtoScannedCode);
        
        let newItems = [...rtoFormData.items];
        
        if (existingItemIndex !== -1) {
          // Increment quantity of existing item
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: (newItems[existingItemIndex].quantity || 1) + 1
          };
        } else {
          // Add new item
          newItems.push({
            product: productMatch._id,
            productName: productMatch.name,
            barcode: productMatch.barcode,
            quantity: 1,
            unitPrice: productMatch.sellingPrice || productMatch.price,
            total: productMatch.sellingPrice || productMatch.price
          });
        }
        
        // Calculate total amount
        const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        
        setRTOFormData(prev => ({
          ...prev,
          items: newItems,
          totalAmount
        }));
        
        setRTOScannedCode("");
        setSuccess(`Added ${productMatch.name} to return items`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        // Try to fetch product by barcode from API
        try {
          const response = await productsAPI.getByBarcode(rtoScannedCode);
          if (response.data) {
            const product = response.data;
            
            // Check if this barcode already exists in RTO items
            const existingItemIndex = rtoFormData.items.findIndex(item => item.barcode === rtoScannedCode);
            
            let newItems = [...rtoFormData.items];
            
            if (existingItemIndex !== -1) {
              // Increment quantity of existing item
              newItems[existingItemIndex] = {
                ...newItems[existingItemIndex],
                quantity: (newItems[existingItemIndex].quantity || 1) + 1
              };
            } else {
              // Add new item
              newItems.push({
                product: product._id,
                productName: product.name,
                barcode: product.barcode,
                quantity: 1,
                unitPrice: product.sellingPrice || product.price,
                total: product.sellingPrice || product.price
              });
            }
            
            // Calculate total amount
            const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
            
            setRTOFormData(prev => ({
              ...prev,
              items: newItems,
              totalAmount
            }));
            
            setRTOScannedCode("");
            setSuccess(`Added ${product.name} to return items`);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
          } else {
            // Product not found, try searching for combo
            try {
              const comboResponse = await combosAPI.getByBarcode(rtoScannedCode);
              if (comboResponse.data) {
                const combo = comboResponse.data;
                
                // Add all products from the combo
                let newItems = [...rtoFormData.items];
                
                if (combo.products && combo.products.length > 0) {
                  // Add each product in the combo
                  combo.products.forEach(comboProduct => {
                    const existingItemIndex = newItems.findIndex(item => 
                      item.product === comboProduct.product._id
                    );
                    
                    if (existingItemIndex !== -1) {
                      // Increment quantity of existing item
                      newItems[existingItemIndex] = {
                        ...newItems[existingItemIndex],
                        quantity: newItems[existingItemIndex].quantity + (comboProduct.quantity || 1)
                      };
                    } else {
                      // Add new item from combo
                      newItems.push({
                        product: comboProduct.product._id,
                        productName: comboProduct.product.name,
                        barcode: comboProduct.product.barcode,
                        quantity: comboProduct.quantity || 1,
                        unitPrice: comboProduct.product.sellingPrice || comboProduct.product.price,
                        total: ((comboProduct.product.sellingPrice || comboProduct.product.price) * (comboProduct.quantity || 1))
                      });
                    }
                  });
                  
                  // Calculate total amount
                  const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
                  
                  setRTOFormData(prev => ({
                    ...prev,
                    items: newItems,
                    totalAmount
                  }));
                  
                  setRTOScannedCode("");
                  setSuccess(`Added combo "${combo.name}" with ${combo.products.length} products to return items`);
                  
                  // Clear success message after 3 seconds
                  setTimeout(() => setSuccess(''), 3000);
                } else {
                  setError(`Combo "${combo.name}" has no products`);
                  setTimeout(() => setError(''), 3000);
                  setRTOScannedCode("");
                }
              } else {
                setError(`Product or combo with barcode ${rtoScannedCode} not found`);
                setTimeout(() => setError(''), 3000);
                setRTOScannedCode("");
              }
            } catch (comboError) {
              setError(`Product or combo with barcode ${rtoScannedCode} not found`);
              setTimeout(() => setError(''), 3000);
              setRTOScannedCode("");
            }
          }
        } catch (error) {
          // Try searching for combo if product API fails
          try {
            const comboResponse = await combosAPI.getByBarcode(rtoScannedCode);
            if (comboResponse.data) {
              const combo = comboResponse.data;
              
              // Add all products from the combo
              let newItems = [...rtoFormData.items];
              
              if (combo.products && combo.products.length > 0) {
                // Add each product in the combo
                combo.products.forEach(comboProduct => {
                  const existingItemIndex = newItems.findIndex(item => 
                    item.product === comboProduct.product._id
                  );
                  
                  if (existingItemIndex !== -1) {
                    // Increment quantity of existing item
                    newItems[existingItemIndex] = {
                      ...newItems[existingItemIndex],
                      quantity: newItems[existingItemIndex].quantity + (comboProduct.quantity || 1)
                    };
                  } else {
                    // Add new item from combo
                    newItems.push({
                      product: comboProduct.product._id,
                      productName: comboProduct.product.name,
                      barcode: comboProduct.product.barcode,
                      quantity: comboProduct.quantity || 1,
                      unitPrice: comboProduct.product.sellingPrice || comboProduct.product.price,
                      total: ((comboProduct.product.sellingPrice || comboProduct.product.price) * (comboProduct.quantity || 1))
                    });
                  }
                });
                
                // Calculate total amount
                const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
                
                setRTOFormData(prev => ({
                  ...prev,
                  items: newItems,
                  totalAmount
                }));
                
                setRTOScannedCode("");
                setSuccess(`Added combo "${combo.name}" with ${combo.products.length} products to return items`);
                
                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(''), 3000);
              } else {
                setError(`Combo "${combo.name}" has no products`);
                setTimeout(() => setError(''), 3000);
                setRTOScannedCode("");
              }
            } else {
              setError(`Product or combo with barcode ${rtoScannedCode} not found`);
              setTimeout(() => setError(''), 3000);
              setRTOScannedCode("");
            }
          } catch (comboError) {
            setError(`Product or combo with barcode ${rtoScannedCode} not found`);
            setTimeout(() => setError(''), 3000);
            setRTOScannedCode("");
          }
        }
      }
      
      // Restart scanner if it was active
      if (rtoScannerActive) {
        stopRTOScanner();
        setTimeout(() => {
          startRTOScanner();
        }, 1000);
      }
    } catch (error) {
      setError(`Error processing barcode: ${rtoScannedCode}`);
      setTimeout(() => setError(''), 3000);
      setRTOScannedCode("");
    }
  };

  // Auto-add scanned items when not in barcode mode
  useEffect(() => {
    if (!rtoScannedCode || rtoBarcodeMode) return;
    
    addRTOScannedItem();
  }, [rtoScannedCode, rtoBarcodeMode]);

  // Focus barcode input when barcode mode is enabled
  useEffect(() => {
    if (rtoBarcodeMode && rtoBarcodeInputRef.current) {
      rtoBarcodeInputRef.current.focus();
    }
  }, [rtoBarcodeMode]);

  // RPU Form Functions
  const handleRPUInputChange = (name, value) => {
    setRPUFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRPUItemChange = (index, field, value) => {
    const newItems = [...rpuFormData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    
    setRPUFormData(prev => ({
      ...prev,
      items: newItems,
      totalAmount
    }));
  };

  const handleAddRPUItem = () => {
    setRPUFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product: '',
        productName: '',
        barcode: '',
        quantity: 1,
        unitPrice: 0,
        total: 0
      }]
    }));
  };

  const handleRemoveRPUItem = (index) => {
    const newItems = rpuFormData.items.filter((_, i) => i !== index);
    const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    
    setRPUFormData(prev => ({
      ...prev,
      items: newItems,
      totalAmount
    }));
  };

  const handleRPUProductSelect = (index, productId) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      const newItems = [...rpuFormData.items];
      newItems[index] = {
        ...newItems[index],
        product: product._id,
        productName: product.name,
        barcode: product.barcode || '',
        unitPrice: product.price
      };
      
      const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      
      setRPUFormData(prev => ({
        ...prev,
        items: newItems,
        totalAmount
      }));
    }
  };

  const handleRPUSubmit = async (e) => {
    e.preventDefault();
    
    if (!rpuFormData.customerName || rpuFormData.items.length === 0) {
      setError('Customer name and at least one item are required');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setLoading(true);
      
      // Prepare the return data for API
      const returnData = {
        category: 'RPU',
        returnDate: rpuFormData.returnDate,
        customerName: rpuFormData.customerName,
        customerPhone: rpuFormData.customerPhone,
        customerEmail: rpuFormData.customerEmail,
        reason: rpuFormData.reason,
        items: rpuFormData.items.map(item => ({
          product: item.product,
          productName: item.productName,
          barcode: item.barcode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity
        })),
        totalAmount: rpuFormData.totalAmount,
        comments: rpuFormData.comments,
        status: 'processed'
      };
      
      // Create the return record
      const response = await returnsAPI.create(returnData);
      
      if (response.data) {
        const returnId = response.data.returnId || response.data.return?.returnId || response.data._id;
        setSuccess(`RPU processed successfully! Return ID: ${returnId}. Record saved (no inventory changes). Check Returns & Tracking page to view details.`);
        
        // Reset form and close modal
        setRPUFormData({
          category: 'RPU',
          returnDate: new Date().toISOString().split('T')[0],
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          reason: 'other',
          items: [],
          totalAmount: 0,
          comments: '',
          status: 'processed'
        });
        setShowRPUModal(false);
        
        // Clear success message after 8 seconds
        setTimeout(() => setSuccess(''), 8000);
      }
    } catch (error) {
      console.error('RPU Submission Error:', error);
      setError(error.response?.data?.message || 'Failed to process RPU. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRPUModal = () => {
    stopRPUScanner(); // Stop scanner when closing modal
    setShowRPUModal(false);
    setRPUFormData({
      category: 'RPU',
      returnDate: new Date().toISOString().split('T')[0],
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      reason: 'not_satisfied',
      items: [],
      totalAmount: 0,
      comments: '',
      status: 'processed'
    });
    setRPUScannedCode('');
    setRPUBarcodeMode(false);
  };

  // RPU Scanner Functions
  const startRPUScanner = () => {
    if (rpuScannerRef.current) {
      Quagga.init(
        {
          inputStream: {
            type: "LiveStream",
            target: rpuScannerRef.current,
            constraints: {
              facingMode: "environment",
            },
          },
          decoder: {
            readers: [
              "code_128_reader",
              "ean_reader",
              "upc_reader",
              "code_39_reader",
            ],
          },
        },
        (err) => {
          if (err) {
            setError("Unable to start RPU scanner: " + err);
            return;
          }
          Quagga.start();
          setRPUScannerActive(true);
        }
      );

      Quagga.onDetected((data) => {
        if (data && data.codeResult && data.codeResult.code) {
          setRPUScannedCode(data.codeResult.code);
        }
      });
    }
  };

  const stopRPUScanner = () => {
    try {
      Quagga.stop();
      setRPUScannerActive(false);
    } catch (error) {
      // Ignore errors when stopping scanner
    }
  };

  const toggleRPUBarcodeMode = () => {
    setRPUBarcodeMode(prev => {
      const newMode = !prev;
      if (newMode) {
        setTimeout(() => {
          if (rpuBarcodeInputRef.current) {
            rpuBarcodeInputRef.current.focus();
          }
        }, 100);
      } else {
        setRPUScannedCode("");
      }
      return newMode;
    });
  };

  const addRPUBarcodeManually = async () => {
    if (!rpuScannedCode || !rpuBarcodeMode) return;
    
    try {
      await addRPUScannedItem();
      setRPUScannedCode("");
    } catch (error) {
      console.error("Error adding barcode manually:", error);
    }
  };

  const addRPUScannedItem = async () => {
    if (!rpuScannedCode) return;
    
    try {
      // Find product by barcode in the products list
      const productMatch = products.find(p => p.barcode === rpuScannedCode);
      
      if (productMatch) {
        // Check if this barcode already exists in RPU items
        const existingItemIndex = rpuFormData.items.findIndex(item => item.barcode === rpuScannedCode);
        
        let newItems = [...rpuFormData.items];
        
        if (existingItemIndex !== -1) {
          // Increment quantity of existing item
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: (newItems[existingItemIndex].quantity || 1) + 1
          };
        } else {
          // Add new item
          newItems.push({
            product: productMatch._id,
            productName: productMatch.name,
            barcode: productMatch.barcode,
            quantity: 1,
            unitPrice: productMatch.sellingPrice || productMatch.price,
            total: productMatch.sellingPrice || productMatch.price
          });
        }
        
        // Calculate total amount
        const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        
        setRPUFormData(prev => ({
          ...prev,
          items: newItems,
          totalAmount
        }));
        
        setRPUScannedCode("");
        setSuccess(`Added ${productMatch.name} to processing items`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        // Try to fetch product by barcode from API
        try {
          const response = await productsAPI.getByBarcode(rpuScannedCode);
          if (response.data) {
            const product = response.data;
            
            // Check if this barcode already exists in RPU items
            const existingItemIndex = rpuFormData.items.findIndex(item => item.barcode === rpuScannedCode);
            
            let newItems = [...rpuFormData.items];
            
            if (existingItemIndex !== -1) {
              // Increment quantity of existing item
              newItems[existingItemIndex] = {
                ...newItems[existingItemIndex],
                quantity: (newItems[existingItemIndex].quantity || 1) + 1
              };
            } else {
              // Add new item
              newItems.push({
                product: product._id,
                productName: product.name,
                barcode: product.barcode,
                quantity: 1,
                unitPrice: product.sellingPrice || product.price,
                total: product.sellingPrice || product.price
              });
            }
            
            // Calculate total amount
            const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
            
            setRPUFormData(prev => ({
              ...prev,
              items: newItems,
              totalAmount
            }));
            
            setRPUScannedCode("");
            setSuccess(`Added ${product.name} to processing items`);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
          } else {
            // Product not found, try combo barcode
            try {
              const comboResponse = await combosAPI.getByBarcode(rpuScannedCode);
              if (comboResponse.data) {
                const combo = comboResponse.data;
                
                // Add all products from the combo
                let newItems = [...rpuFormData.items];
                
                combo.products.forEach(comboProduct => {
                  const existingItemIndex = newItems.findIndex(item => item.product === comboProduct.product._id);
                  
                  if (existingItemIndex !== -1) {
                    // Increment quantity by combo product quantity
                    newItems[existingItemIndex] = {
                      ...newItems[existingItemIndex],
                      quantity: newItems[existingItemIndex].quantity + comboProduct.quantity
                    };
                  } else {
                    // Add new item
                    newItems.push({
                      product: comboProduct.product._id,
                      productName: comboProduct.product.name,
                      barcode: comboProduct.product.barcode,
                      quantity: comboProduct.quantity,
                      unitPrice: comboProduct.product.sellingPrice || comboProduct.product.price,
                      total: (comboProduct.product.sellingPrice || comboProduct.product.price) * comboProduct.quantity
                    });
                  }
                });
                
                // Calculate total amount
                const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
                
                setRPUFormData(prev => ({
                  ...prev,
                  items: newItems,
                  totalAmount
                }));
                
                setRPUScannedCode("");
                setSuccess(`Added combo "${combo.name}" with ${combo.products.length} products to processing items`);
                
                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(''), 3000);
              } else {
                setError(`Product or combo with barcode ${rpuScannedCode} not found`);
                setTimeout(() => setError(''), 3000);
              }
            } catch (comboError) {
              setError(`Product or combo with barcode ${rpuScannedCode} not found`);
              setTimeout(() => setError(''), 3000);
            }
          }
        } catch (error) {
          // Try combo barcode if product API also fails
          try {
            const comboResponse = await combosAPI.getByBarcode(rpuScannedCode);
            if (comboResponse.data) {
              const combo = comboResponse.data;
              
              // Add all products from the combo
              let newItems = [...rpuFormData.items];
              
              combo.products.forEach(comboProduct => {
                const existingItemIndex = newItems.findIndex(item => item.product === comboProduct.product._id);
                
                if (existingItemIndex !== -1) {
                  // Increment quantity by combo product quantity
                  newItems[existingItemIndex] = {
                    ...newItems[existingItemIndex],
                    quantity: newItems[existingItemIndex].quantity + comboProduct.quantity
                  };
                } else {
                  // Add new item
                  newItems.push({
                    product: comboProduct.product._id,
                    productName: comboProduct.product.name,
                    barcode: comboProduct.product.barcode,
                    quantity: comboProduct.quantity,
                    unitPrice: comboProduct.product.sellingPrice || comboProduct.product.price,
                    total: (comboProduct.product.sellingPrice || comboProduct.product.price) * comboProduct.quantity
                  });
                }
              });
              
              // Calculate total amount
              const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
              
              setRPUFormData(prev => ({
                ...prev,
                items: newItems,
                totalAmount
              }));
              
              setRPUScannedCode("");
              setSuccess(`Added combo "${combo.name}" with ${combo.products.length} products to processing items`);
              
              // Clear success message after 3 seconds
              setTimeout(() => setSuccess(''), 3000);
            } else {
              setError(`Product or combo with barcode ${rpuScannedCode} not found`);
              setTimeout(() => setError(''), 3000);
            }
          } catch (comboError) {
            setError(`Product or combo with barcode ${rpuScannedCode} not found`);
            setTimeout(() => setError(''), 3000);
          }
        }
      }
      
      // Restart scanner if it was active
      if (rpuScannerActive) {
        stopRPUScanner();
        setTimeout(() => {
          startRPUScanner();
        }, 1000);
      }
    } catch (error) {
      setError(`Error processing barcode: ${rpuScannedCode}`);
      setTimeout(() => setError(''), 3000);
      setRPUScannedCode("");
    }
  };

  // Auto-add scanned items when not in barcode mode for RPU
  useEffect(() => {
    if (!rpuScannedCode || rpuBarcodeMode) return;
    
    addRPUScannedItem();
  }, [rpuScannedCode, rpuBarcodeMode]);

  // Focus barcode input when barcode mode is enabled for RPU
  useEffect(() => {
    if (rpuBarcodeMode && rpuBarcodeInputRef.current) {
      rpuBarcodeInputRef.current.focus();
    }
  }, [rpuBarcodeMode]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress sx={{ color: '#000' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: 'rgba(248, 245, 240, 0.85)', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: THEME.charcoal, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <InventoryIcon sx={{ fontSize: '2rem', color: THEME.gold }} />
          Products Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Barcode scanner/filter input */}
          <TextField
            size="small"
            placeholder="Scan or enter barcode"
            value={barcodeFilter}
            onChange={handleBarcodeInput}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: barcodeFilter && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setBarcodeFilter('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250, bgcolor: '#fafafa' }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleShowModal()}
            sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#333' }, textTransform: 'none' }}
          >
            Add Product
          </Button>
          <Button
            variant="outlined"
            onClick={() => setShowRTOModal(true)}
            sx={{ borderColor: THEME.gold, color: THEME.gold, '&:hover': { borderColor: THEME.richGold, bgcolor: THEME.lightGold }, textTransform: 'none', fontWeight: 600 }}
          >
            RTO
          </Button>
          <Button
            variant="outlined"
            onClick={() => setShowRPUModal(true)}
            sx={{ borderColor: THEME.gold, color: THEME.gold, '&:hover': { borderColor: THEME.richGold, bgcolor: THEME.lightGold }, textTransform: 'none', fontWeight: 600 }}
          >
            RPU
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={clearAlerts} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={clearAlerts} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={clearAlerts} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={clearAlerts} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      {/* Batch Action Buttons */}
      {selectedProducts.length > 0 && (
        <Box sx={{ mb: 2, p: 2, bgcolor: '#fafafa', borderRadius: 1, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography sx={{ color: '#000', fontWeight: 500 }}>
            {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
          </Typography>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleBatchBarcodeDownload}
            sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' }, textTransform: 'none' }}
          >
            Download Barcodes
          </Button>
          <Button
            variant="contained"
            startIcon={<DeleteIcon />}
            onClick={handleBatchDelete}
            sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#9a0007' }, textTransform: 'none' }}
          >
            Delete Selected
          </Button>
        </Box>
      )}

      <TableContainer component={Paper} sx={{ boxShadow: '0px 1px 2px rgba(212, 175, 55, 0.15)', border: `1px solid ${THEME.softGold}`, borderRadius: '12px', overflowX: 'auto' }}>
        {products.length > 0 ? (
          <Table sx={{ minWidth: 1000 }}>
            <TableHead sx={{ bgcolor: THEME.gold }}>
              <TableRow>
                <TableCell padding="checkbox" sx={{ color: THEME.black }}>
                  <Checkbox 
                    checked={selectAll}
                    onChange={handleSelectAll}
                    sx={{ color: THEME.black, '&.Mui-checked': { color: THEME.black } }}
                  />
                </TableCell>
                <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>S.No</TableCell>
                <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Product</TableCell>
                <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Barcode</TableCell>
                <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Cost Price</TableCell>
                <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Selling Price</TableCell>
                <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Min Qty</TableCell>
                <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Stock Level</TableCell>
                <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ color: THEME.black, fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filterProductsByBarcode().length > 0 ? (
                filterProductsByBarcode().map((product, index) => (
                  <TableRow key={product._id} hover sx={{ '&:hover': { bgcolor: '#F4E3B2' } }}>
                    <TableCell padding="checkbox">
                      <Checkbox 
                        checked={selectedProducts.includes(product._id)}
                        onChange={() => handleSelectProduct(product._id)}
                      />
                    </TableCell>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ProductImage product={product} />
                        {product.name}
                      </Box>
                    </TableCell>
                    <TableCell>{product.barcode || '-'}</TableCell>
                    <TableCell>
                      {product.category?.code ? `${product.category.code} - ${product.category.name}` : 'N/A'}
                    </TableCell>
                    <TableCell>₹{(product.costPrice || product.price)?.toLocaleString('en-IN') || 0}</TableCell>
                    <TableCell>₹{(product.sellingPrice || product.price)?.toLocaleString('en-IN') || 0}</TableCell>
                    <TableCell>{product.minquantity}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">{product.quantity}</Typography>
                        <Box sx={{ flex: 1, minWidth: 60 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min((product.quantity / Math.max(product.quantity * 2, 100)) * 100, 100)}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: '#f1f2f6',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: product.quantity <= 0 ? '#d32f2f' : 
                                        product.quantity <= product.minquantity ? '#ed6c02' : '#2e7d32'
                              }
                            }}
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStockStatusText(product.quantity, product.minquantity)}
                        size="small"
                        sx={{
                          bgcolor: product.quantity <= 0 ? '#ffebee' : 
                                  product.quantity <= product.minquantity ? '#fff3e0' : '#e8f5e9',
                          color: product.quantity <= 0 ? '#d32f2f' : 
                                product.quantity <= product.minquantity ? '#ed6c02' : '#2e7d32',
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton 
                          size="small"
                          onClick={() => handleShowModal(product)}
                          title="Edit Product"
                          sx={{ color: '#1976d2' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small"
                          onClick={() => handleDelete(product._id)}
                          title="Delete Product"
                          sx={{ color: '#d32f2f' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        {product.barcode && (
                          <IconButton
                            size="small"
                            onClick={async () => await downloadBarcode(product.barcode, product.name)}
                            title="Download Barcode"
                            sx={{ color: '#2e7d32' }}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10}>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <SearchIcon sx={{ fontSize: 48, color: '#bdbdbd', mb: 2 }} />
                      <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                        No products found with barcode "{barcodeFilter}"
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#999', mb: 2 }}>
                        Try a different barcode or clear the search filter.
                      </Typography>
                      <Button 
                        variant="outlined"
                        onClick={() => setBarcodeFilter('')}
                        sx={{ borderColor: '#000', color: '#000', textTransform: 'none' }}
                      >
                        Clear Filter
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <InventoryIcon sx={{ fontSize: 64, color: '#bdbdbd', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
              No Products Found
            </Typography>
            <Typography variant="body2" sx={{ color: '#999' }}>
              Get started by adding your first product.
            </Typography>
          </Box>
        )}
      </TableContainer>

      {/* Product Add/Edit Modal */}
      <Dialog open={showModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#000' }}>
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </Typography>
          <IconButton onClick={handleCloseModal} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter product name"
              />

              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  label="Category"
                >
                  <MenuItem value="">Select a category</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.code} - {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="number"
                label="Cost Price (₹)"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleInputChange}
                required
                inputProps={{ step: '0.01', min: '0' }}
              />

              <TextField
                fullWidth
                type="number"
                label="Selling Price (₹)"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleInputChange}
                required
                inputProps={{ step: '0.01', min: '0' }}
              />

              <TextField
                fullWidth
                type="number"
                label="Min Quantity"
                name="minquantity"
                value={formData.minquantity}
                onChange={handleInputChange}
                required
                inputProps={{ step: '1' }}
              />

              <TextField
                fullWidth
                type="number"
                label="Quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                required
              />

              <FormControl fullWidth required>
                <InputLabel>Vendor</InputLabel>
                <Select
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleInputChange}
                  label="Vendor"
                >
                  <MenuItem value="">Select a vendor</MenuItem>
                  {vendors.map(vendor => (
                    <MenuItem key={vendor._id} value={vendor._id}>
                      {vendor.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CameraIcon />}
                  fullWidth
                  sx={{ borderColor: '#000', color: '#000', textTransform: 'none', py: 1.5 }}
                >
                  Upload Product Image
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handleFileChange}
                    hidden
                  />
                </Button>
                {formData.imagePreview && (
                  <Box sx={{ mt: 1 }}>
                    <img src={formData.imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8 }} />
                    <Button 
                      size="small" 
                      color="error" 
                      onClick={removeImage}
                      sx={{ mt: 1, textTransform: 'none' }}
                    >
                      Remove Image
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter product description"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={handleCloseModal} sx={{ color: '#666', textTransform: 'none' }}>
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#333' }, textTransform: 'none' }}
            >
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </DialogActions>
        </form>
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

      {/* Old Image Preview Modal - keeping for backward compatibility */}
      <Dialog open={!!imagePreview} onClose={closeImagePreview} maxWidth="lg" PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}>
        <IconButton
          onClick={closeImagePreview}
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            bgcolor: 'rgba(255,255,255,0.2)',
            color: '#fff',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
          }}
        >
          <CloseIcon />
        </IconButton>
        <Box sx={{ maxWidth: '90vw', maxHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={imagePreview} alt="Product preview" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }} />
        </Box>
      </Dialog>

      {/* RTO (Return to Origin) Modal */}
      {showRTOModal && (
        <Dialog open={showRTOModal} onClose={handleCloseRTOModal} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: THEME.gold, color: THEME.black, pb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  Return to Origin (RTO)
                </Typography>
                <Typography variant="caption" sx={{ color: THEME.softCharcoal, mt: 0.5, display: 'block' }}>
                  Process customer returns and automatically restore inventory quantities
                </Typography>
              </Box>
              <IconButton onClick={handleCloseRTOModal} size="small" sx={{ color: THEME.black }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <form onSubmit={handleRTOSubmit}>
            <DialogContent sx={{ p: 3 }}>
                {/* Customer Information */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ color: THEME.charcoal, mb: 2, pb: 1, borderBottom: `2px solid ${THEME.gold}`, fontWeight: 600 }}>
                    Customer Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Return Date"
                      value={rtoFormData.returnDate}
                      onChange={(e) => handleRTOInputChange('returnDate', e.target.value)}
                      required
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                    <FormControl fullWidth required size="small">
                      <InputLabel>Customer Name</InputLabel>
                      <Select
                        value={rtoFormData.customerName}
                        onChange={(e) => handleRTOInputChange('customerName', e.target.value)}
                        label="Customer Name"
                      >
                        <MenuItem value="">Select customer...</MenuItem>
                        {vendors.map((vendor) => (
                          <MenuItem key={vendor._id} value={vendor.name}>
                            {vendor.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      type="tel"
                      label="Customer Phone"
                      value={rtoFormData.customerPhone}
                      onChange={(e) => handleRTOInputChange('customerPhone', e.target.value)}
                      placeholder="Enter phone number"
                      size="small"
                    />
                    <TextField
                      fullWidth
                      type="email"
                      label="Customer Email"
                      value={rtoFormData.customerEmail}
                      onChange={(e) => handleRTOInputChange('customerEmail', e.target.value)}
                      placeholder="Enter email address"
                      size="small"
                    />
                    <FormControl fullWidth required size="small">
                      <InputLabel>Return Reason</InputLabel>
                      <Select
                        value={rtoFormData.reason}
                        onChange={(e) => handleRTOInputChange('reason', e.target.value)}
                        label="Return Reason"
                      >
                        <MenuItem value="not_satisfied">Customer not reached</MenuItem>
                        <MenuItem value="wrong_item">Wrong item delivered (claim)</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>

                {/* Barcode Scanning Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ color: THEME.charcoal, mb: 2, pb: 1, borderBottom: `2px solid ${THEME.gold}`, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    📷 Scan Return Items
                  </Typography>

                  <Alert severity={rtoScannerActive ? 'success' : 'info'} sx={{ mb: 2 }}>
                    {rtoScannerActive ? '🟢Active' : '🔴Inactive'}
                  </Alert>
                  
                  <Box
                    ref={rtoScannerRef}
                    sx={{
                      mb: 2,
                      height: 300,
                      bgcolor: '#000',
                      borderRadius: 1,
                      overflow: 'hidden',
                      position: 'relative',
                      border: `2px solid ${THEME.gold}`,
                      '& video, & canvas': {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }
                    }}
                  />

                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Button
                      type="button"
                      variant={rtoScannerActive ? 'contained' : 'outlined'}
                      onClick={rtoScannerActive ? stopRTOScanner : startRTOScanner}
                      sx={{
                        bgcolor: rtoScannerActive ? '#d32f2f' : 'transparent',
                        borderColor: THEME.gold,
                        color: rtoScannerActive ? '#fff' : THEME.gold,
                        '&:hover': {
                          bgcolor: rtoScannerActive ? '#c62828' : THEME.lightGold,
                          borderColor: THEME.gold
                        }
                      }}
                    >
                      {rtoScannerActive ? '⏹️ Stop Scanner' : '📷 Start Scanner'}
                    </Button>
                  </Box>

                  {/* Barcode Input */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <TextField
                        inputRef={rtoBarcodeInputRef}
                        type="text"
                        label="Scanned Barcode"
                        value={rtoScannedCode}
                        onChange={(e) => setRTOScannedCode(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (rtoBarcodeMode && rtoScannedCode.trim()) {
                              addRTOBarcodeManually();
                            }
                          }
                        }}
                        placeholder={rtoBarcodeMode ? "Barcode mode active - scan or enter barcode" : "Enter barcode manually"}
                        disabled={!rtoBarcodeMode}
                        size="small"
                        sx={{ flex: 1, minWidth: 200 }}
                      />
                      <Button
                        type="button"
                        variant={rtoBarcodeMode ? 'contained' : 'outlined'}
                        onClick={toggleRTOBarcodeMode}
                        sx={{
                          bgcolor: rtoBarcodeMode ? '#2e7d32' : 'transparent',
                          borderColor: rtoBarcodeMode ? '#2e7d32' : THEME.gold,
                          color: rtoBarcodeMode ? '#fff' : THEME.gold,
                          '&:hover': {
                            bgcolor: rtoBarcodeMode ? '#1b5e20' : THEME.lightGold,
                            borderColor: rtoBarcodeMode ? '#2e7d32' : THEME.gold
                          }
                        }}
                      >
                        {rtoBarcodeMode ? '✓ Barcode Active' : '📊 Enable Barcode'}
                      </Button>
                      {rtoBarcodeMode && rtoScannedCode && (
                        <Button
                          type="button"
                          variant="contained"
                          onClick={addRTOBarcodeManually}
                          sx={{
                            bgcolor: '#2e7d32',
                            '&:hover': { bgcolor: '#1b5e20' }
                          }}
                        >
                          ➕ Add Item
                        </Button>
                      )}
                    </Box>
                    {rtoBarcodeMode && (
                      <Typography variant="caption" sx={{ color: '#666', mt: 1, display: 'block' }}>
                        📍 Barcode mode is active. Scan barcode or press Enter to add items automatically.
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Return Items */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: THEME.charcoal, fontWeight: 600, pb: 1, borderBottom: `2px solid ${THEME.gold}` }}>
                      Return Items ({rtoFormData.items.length})
                    </Typography>
                    <Button
                      type="button"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleAddRTOItem}
                      sx={{
                        borderColor: THEME.gold,
                        color: THEME.gold,
                        '&:hover': { borderColor: THEME.richGold, bgcolor: THEME.lightGold }
                      }}
                    >
                      Add Item Manually
                    </Button>
                  </Box>

                  {rtoFormData.items.length > 0 ? (
                    <TableContainer component={Paper} sx={{ border: `1px solid ${THEME.softGold}`, borderRadius: 2 }}>
                      <Table>
                        <TableHead sx={{ bgcolor: THEME.lightGold }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: THEME.black }}>Product</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: THEME.black }}>Barcode</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: THEME.black }}>Price</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: THEME.black }}>Quantity</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: THEME.black }}>Total</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: THEME.black }}>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rtoFormData.items.map((item, index) => (
                            <TableRow key={index} hover>
                              <TableCell>
                                <FormControl fullWidth size="small">
                                  <Select
                                    value={item.product}
                                    onChange={(e) => handleRTOProductSelect(index, e.target.value)}
                                    required
                                  >
                                    <MenuItem value="">Select Product</MenuItem>
                                    {products.map(product => (
                                      <MenuItem key={product._id} value={product._id}>
                                        {product.name}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={item.barcode || 'N/A'}
                                  size="small"
                                  sx={{
                                    bgcolor: THEME.gold,
                                    color: THEME.black,
                                    fontWeight: 500
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  type="number"
                                  inputProps={{ step: '0.01', min: '0' }}
                                  value={item.unitPrice}
                                  onChange={(e) => handleRTOItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  size="small"
                                  sx={{ width: 100 }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  type="number"
                                  inputProps={{ min: '1' }}
                                  value={item.quantity}
                                  onChange={(e) => handleRTOItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                  size="small"
                                  sx={{ width: 80 }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>
                                ₹{(item.unitPrice * item.quantity).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveRTOItem(index)}
                                  sx={{ color: '#d32f2f' }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ bgcolor: '#fafafa' }}>
                            <TableCell colSpan={4} sx={{ textAlign: 'right', fontWeight: 600 }}>
                              Total Return Amount:
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#d32f2f' }}>
                              ₹{rtoFormData.totalAmount.toFixed(2)}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Paper
                      sx={{
                        textAlign: 'center',
                        p: 4,
                        bgcolor: '#fafafa',
                        border: '2px dashed #ddd',
                        borderRadius: 2
                      }}
                    >
                      <Typography sx={{ fontSize: '2rem', color: '#999', mb: 1 }}>📦</Typography>
                      <Typography sx={{ color: '#666' }}>No items added yet. Click "Add Item" to start.</Typography>
                    </Paper>
                  )}
                </Box>

                {/* Comments */}
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Additional Comments"
                    value={rtoFormData.comments}
                    onChange={(e) => handleRTOInputChange('comments', e.target.value)}
                    placeholder="Enter any additional notes about the return..."
                  />
                </Box>
              </DialogContent>
              
              <DialogActions sx={{ p: 2, bgcolor: '#fafafa', borderTop: `1px solid ${THEME.softGold}` }}>
                <Button
                  type="button"
                  onClick={handleCloseRTOModal}
                  disabled={loading}
                  sx={{ color: '#666', textTransform: 'none' }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    bgcolor: '#d32f2f',
                    '&:hover': { bgcolor: '#c62828' },
                    textTransform: 'none'
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1, color: '#fff' }} />
                      Processing...
                    </>
                  ) : (
                    <>
                      ✓ Process Return
                    </>
                  )}
                </Button>
              </DialogActions>
            </form>
          </Dialog>
      )}

      {/* RPU (Return Pick Up) Modal */}
      {showRPUModal && (
        <Dialog open={showRPUModal} onClose={handleCloseRPUModal} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor:THEME.gold ,color:THEME.offWhite, pb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, color: THEME.black }}>
                   Return Pick Up (RPU)
                </Typography>
                <Typography variant="caption" sx={{ color: THEME.charcoal, mt: 0.5, display: 'block' }}>
                  Record customer return pickup (no inventory changes)
                </Typography>
              </Box>
              <IconButton onClick={handleCloseRPUModal} size="small" sx={{ color: THEME.white }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <form onSubmit={handleRPUSubmit}>
            <DialogContent sx={{ p: 3 }}>
                {/* Customer Information */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ color: THEME.charcoal, mb: 2, pb: 1, borderBottom: `2px solid ${THEME.black}`, fontWeight: 600 }}>
                    Customer Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Pickup Date"
                      value={rpuFormData.returnDate}
                      onChange={(e) => handleRPUInputChange('returnDate', e.target.value)}
                      required
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                    <FormControl fullWidth required size="small">
                      <InputLabel>Customer Name</InputLabel>
                      <Select
                        value={rpuFormData.customerName}
                        onChange={(e) => handleRPUInputChange('customerName', e.target.value)}
                        label="Customer Name"
                      >
                        <MenuItem value="">Select customer...</MenuItem>
                        {vendors.map((vendor) => (
                          <MenuItem key={vendor._id} value={vendor.name}>
                            {vendor.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      type="tel"
                      label="Customer Phone"
                      value={rpuFormData.customerPhone}
                      onChange={(e) => handleRPUInputChange('customerPhone', e.target.value)}
                      placeholder="Enter phone number"
                      size="small"
                    />
                    <TextField
                      fullWidth
                      type="email"
                      label="Customer Email"
                      value={rpuFormData.customerEmail}
                      onChange={(e) => handleRPUInputChange('customerEmail', e.target.value)}
                      placeholder="Enter email address"
                      size="small"
                    />
                    <FormControl fullWidth required size="small">
                      <InputLabel>Pickup Reason</InputLabel>
                      <Select
                        value={rpuFormData.reason}
                        onChange={(e) => handleRPUInputChange('reason', e.target.value)}
                        label="Pickup Reason"
                        placeholder="Select Reason"
                      >
                        <MenuItem value="not_satisfied">Customer not reached</MenuItem>
                        <MenuItem value="wrong_item">Wrong item delivered (claim)</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>

                {/* Item Scanner Section */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: THEME.charcoal, fontWeight: 600, pb: 1, borderBottom: `2px solid ${THEME.black}` }}>
                      Items to Process
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Button
                        type="button"
                        variant="contained"
                        onClick={toggleRPUBarcodeMode}
                        size="small"
                        sx={{
                          bgcolor: rpuBarcodeMode ? THEME.black : '#95a5a6',
                          color: THEME.white,
                          '&:hover': { bgcolor: rpuBarcodeMode ? THEME.charcoal : '#7f8c8d' },
                          textTransform: 'none'
                        }}
                      >
                        {rpuBarcodeMode ? '⌨️ Manual Entry' : '📊 Scan Mode'}
                      </Button>
                      <Button
                        type="button"
                        variant="contained"
                        onClick={rpuScannerActive ? stopRPUScanner : startRPUScanner}
                        size="small"
                        sx={{
                          bgcolor: rpuScannerActive ? '#d32f2f' : '#2e7d32',
                          color: THEME.white,
                          '&:hover': { bgcolor: rpuScannerActive ? '#c62828' : '#1b5e20' },
                          textTransform: 'none'
                        }}
                      >
                        {rpuScannerActive ? '⏹️ Stop Camera' : '📷 Start Camera'}
                      </Button>
                    </Box>
                  </Box>

                  {/* Scanner Container */}
                  {rpuScannerActive && (
                    <Box
                      sx={{
                        mb: 2,
                        border: `2px solid ${THEME.black}`,
                        borderRadius: 2,
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                    >
                      <Box
                        ref={rpuScannerRef}
                        sx={{
                          width: '100%',
                          height: 300,
                          bgcolor: '#000',
                          position: 'relative',
                          '& video, & canvas': {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          bgcolor: 'rgba(0, 0, 0, 0.8)',
                          color: THEME.white,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        📷 RPU Scanner Active
                      </Box>
                    </Box>
                  )}

                  {/* Manual Barcode Input */}
                  {rpuBarcodeMode && (
                    <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        inputRef={rpuBarcodeInputRef}
                        type="text"
                        label="Barcode"
                        value={rpuScannedCode}
                        onChange={(e) => setRPUScannedCode(e.target.value)}
                        placeholder="Enter or scan barcode..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addRPUBarcodeManually();
                          }
                        }}
                        size="small"
                        sx={{ flex: 1 }}
                      />
                      <Button
                        type="button"
                        variant="contained"
                        onClick={addRPUBarcodeManually}
                        sx={{
                          bgcolor: THEME.black,
                          '&:hover': { bgcolor: THEME.charcoal },
                          textTransform: 'none'
                        }}
                      >
                        ➕ Add Item
                      </Button>
                    </Box>
                  )}

                  {/* Scanned Code Display */}
                  {rpuScannedCode && !rpuBarcodeMode && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Scanned: <strong>{rpuScannedCode}</strong>
                    </Alert>
                  )}
                </Box>

                {/* Items List */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: THEME.charcoal, fontWeight: 600 }}>Items ({rpuFormData.items.length})</Typography>
                    <Button
                      type="button"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleAddRPUItem}
                      size="small"
                      sx={{
                        borderColor: THEME.black,
                        color: THEME.black,
                        '&:hover': { borderColor: THEME.charcoal, bgcolor: '#f5f5f5' },
                        textTransform: 'none'
                      }}
                    >
                      Add Item
                    </Button>
                  </Box>

                  {rpuFormData.items.length === 0 ? (
                    <Paper
                      sx={{
                        textAlign: 'center',
                        p: 4,
                        bgcolor: '#fafafa',
                        border: '2px dashed #ddd',
                        borderRadius: 2
                      }}
                    >
                      <Typography sx={{ fontSize: '2rem', color: '#999', mb: 1 }}>📦</Typography>
                      <Typography sx={{ color: '#666', fontSize: '0.9rem' }}>
                        No items added yet. Use the camera scanner or add items manually.
                      </Typography>
                    </Paper>
                  ) : (
                    <TableContainer component={Paper} sx={{ border: `1px solid ${THEME.softGold}`, borderRadius: 2, maxHeight: 400 }}>
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#fafafa' }}>
                            <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa' }}>Product</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 100, bgcolor: '#fafafa' }}>Barcode</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 80, textAlign: 'center', bgcolor: '#fafafa' }}>Qty</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 100, textAlign: 'right', bgcolor: '#fafafa' }}>Unit Price</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 100, textAlign: 'right', bgcolor: '#fafafa' }}>Total</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 50, textAlign: 'center', bgcolor: '#fafafa' }}>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rpuFormData.items.map((item, index) => (
                            <TableRow key={index} hover>
                              <TableCell>
                                <FormControl fullWidth size="small">
                                  <Select
                                    value={item.product}
                                    onChange={(e) => handleRPUProductSelect(index, e.target.value)}
                                    required
                                  >
                                    <MenuItem value="">Select Product</MenuItem>
                                    {products.map(product => (
                                      <MenuItem key={product._id} value={product._id}>
                                        {product.name}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={item.barcode || 'N/A'}
                                  size="small"
                                  sx={{ bgcolor: THEME.softGold, color: THEME.black, fontSize: '0.8rem' }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleRPUItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                                  inputProps={{ min: 1 }}
                                  size="small"
                                  sx={{ width: 60 }}
                                  required
                                />
                              </TableCell>
                              <TableCell sx={{ textAlign: 'right' }}>
                                ₹{(item.unitPrice || 0).toFixed(2)}
                              </TableCell>
                              <TableCell sx={{ textAlign: 'right', fontWeight: 600 }}>
                                ₹{((item.unitPrice || 0) * (item.quantity || 0)).toFixed(2)}
                              </TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveRPUItem(index)}
                                  sx={{ color: '#d32f2f' }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ bgcolor: '#fafafa' }}>
                            <TableCell colSpan={4} sx={{ textAlign: 'right', fontWeight: 600 }}>
                              Total Amount:
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem', color: THEME.black, textAlign: 'right' }}>
                              ₹{rpuFormData.totalAmount.toFixed(2)}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>

                {/* Comments Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ color: THEME.charcoal, mb: 2, pb: 1, borderBottom: `2px solid ${THEME.black}`, fontWeight: 600 }}>
                    Additional Notes
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Comments/Notes"
                    value={rpuFormData.comments}
                    onChange={(e) => handleRPUInputChange('comments', e.target.value)}
                    placeholder="Additional notes about the pickup..."
                  />
                </Box>

                {/* Info Alert */}
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <strong>Note:</strong> RPU (Return Pick Up) only records the transaction. 
                  Product inventory quantities will <strong>NOT</strong> be modified during this process.
                </Alert>
              </DialogContent>

              <DialogActions sx={{ p: 2, bgcolor: '#fafafa', borderTop: `1px solid ${THEME.softGold}` }}>
                <Button
                  type="button"
                  onClick={handleCloseRPUModal}
                  sx={{ color: '#666', textTransform: 'none' }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || rpuFormData.items.length === 0}
                  sx={{
                    bgcolor: THEME.black,
                    '&:hover': { bgcolor: THEME.charcoal },
                    textTransform: 'none'
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1, color: '#fff' }} />
                      Recording...
                    </>
                  ) : (
                    <>
                      Record Pickup
                    </>
                  )}
                </Button>
              </DialogActions>
            </form>
          </Dialog>
      )}
    </Box>
  );
};

export default Products;