import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
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
  IconButton,
  Alert,
  Snackbar,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Category as CategoryIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { categoriesAPI } from '../services/api';
import { socket } from '../services/socket';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      setError('Failed to load categories');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Filter categories based on search term
  useEffect(() => {
    const filtered = categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.code.includes(searchTerm) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredCategories(filtered);
  }, [categories, searchTerm]);

  useEffect(() => {
    const handleCategoriesChange = () => {
      loadCategories();
    };

    socket.on('categories:changed', handleCategoriesChange);

    return () => {
      socket.off('categories:changed', handleCategoriesChange);
    };
  }, [loadCategories]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      setError('Name and code are required');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setLoading(true);
      
      if (editingCategory) {
        await categoriesAPI.update(editingCategory._id, formData);
        setSuccess('Category updated successfully!');
      } else {
        await categoriesAPI.create(formData);
        setSuccess('Category created successfully!');
      }

      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', code: '', description: '' });
      loadCategories();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save category');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      setLoading(true);
      await categoriesAPI.delete(categoryId);
      setSuccess('Category deleted successfully!');
      loadCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete category');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = async () => {
    try {
      const response = await categoriesAPI.getNextCode();
      const nextCode = response.data.nextCode;
      
      setFormData({ name: '', code: nextCode, description: '' });
      setEditingCategory(null);
      setShowModal(true);
    } catch (error) {
      setError('Failed to get next category code');
      setTimeout(() => setError(''), 3000);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', code: '', description: '' });
  };

  if (loading && categories.length === 0) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress sx={{ color: '#000' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#fafafa', minHeight: '100vh' }}>
      <Snackbar 
        open={!!success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
      </Snackbar>

      <Snackbar 
        open={!!error} 
        autoHideDuration={5000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#000' }}>
          Categories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateModal}
          sx={{
            bgcolor: '#000',
            color: '#fff',
            textTransform: 'none',
            '&:hover': { bgcolor: '#333' }
          }}
        >
          Add Category
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0' }}>
        <TextField
          fullWidth
          placeholder="Search categories by name, code, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: '#666', mr: 1 }} />
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': { border: 'none' }
            }
          }}
        />
      </Paper>

      {filteredCategories.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CategoryIcon sx={{ fontSize: 80, color: '#e0e0e0', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
            No Categories Found
          </Typography>
          <Typography variant="body2" sx={{ color: '#999', mb: 3 }}>
            {searchTerm 
              ? `No categories match "${searchTerm}". Try adjusting your search.`
              : 'Get started by creating your first product category.'
            }
          </Typography>
          {!searchTerm && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateModal}
              sx={{
                bgcolor: '#000',
                color: '#fff',
                textTransform: 'none',
                '&:hover': { bgcolor: '#333' }
              }}
            >
              Create First Category
            </Button>
          )}
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#D4AF37' }}>
                <TableCell sx={{ fontWeight: 600, color: '#000' }}>S.No</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#000' }}>Category Code</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#000' }}>Category Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#000' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#000' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCategories.map((category, index) => (
                <TableRow 
                  key={category._id}
                  sx={{ '&:hover': { bgcolor: '#F4E3B2' } }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        bgcolor: '#000',
                        color: '#fff',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        display: 'inline-block'
                      }}
                    >
                      {category.code}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{category.name}</TableCell>
                  <TableCell sx={{ color: '#666' }}>
                    {category.description || '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit(category)}
                        sx={{ color: '#000' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(category._id)}
                        sx={{ color: '#d32f2f' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={showModal} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </Typography>
            <IconButton onClick={closeModal} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={3}>
              <TextField
                label="Category Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                fullWidth
              />
              
              <TextField
                label="Category Code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                required
                fullWidth
                inputProps={{
                  pattern: "[0-9]{3}",
                  maxLength: 3
                }}
                helperText="Must be exactly 3 digits (e.g., 001, 002, 003)"
              />
              
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={4}
                fullWidth
              />
            </Stack>
          </DialogContent>
          
          <DialogActions sx={{ p: 2, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={closeModal} sx={{ textTransform: 'none', color: '#666' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                bgcolor: '#000',
                color: '#fff',
                textTransform: 'none',
                '&:hover': { bgcolor: '#333' }
              }}
            >
              {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : (editingCategory ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Categories;