import React, { useState, useEffect } from 'react';
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
  Avatar,
  CircularProgress,
  Fade,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { buyersAPI } from '../services/api';

const Buyers = () => {
  const [buyers, setBuyers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBuyers();
  }, []);

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      const response = await buyersAPI.getAll();
  setBuyers(response.data);
      setError('');
    } catch (error) {
      setError('Failed to fetch buyers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (buyer = null) => {
    if (buyer) {
      setEditingBuyer(buyer);
      setFormData({
        name: buyer.name,
        companyName: buyer.companyName,
        email: buyer.email || '',
        phone: buyer.phone || '',
        address: buyer.address
      });
    } else {
      setEditingBuyer(null);
      setFormData({
        name: '',
        companyName: '',
        email: '',
        phone: '',
        address: ''
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBuyer(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBuyer) {
        await buyersAPI.update(editingBuyer._id, formData);
        setSuccess('Buyer updated successfully!');
      } else {
        await buyersAPI.create(formData);
        setSuccess('Buyer created successfully!');
      }
      fetchBuyers();
      handleCloseModal();
    } catch (error) {
      setError('Failed to save buyer. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this buyer?')) {
      try {
        await buyersAPI.delete(id);
        setSuccess('Buyer deleted successfully!');
        fetchBuyers();
      } catch (error) {
        setError('Failed to delete buyer. Please try again.');
      }
    }
  };

  const clearAlerts = () => {
    setError('');
    setSuccess('');
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: 'rgba(255, 255, 255, 0.85)', minHeight: '100vh' }}>
      {/* Page Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ color: '#000', fontWeight: 600, mb: 0.5 }}>
            Buyers Management
          </Typography>
          <Box sx={{ width: 60, height: 4, bgcolor: '#000', borderRadius: 1 }} />
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleShowModal()}
          sx={{
            bgcolor: '#000',
            color: '#fff',
            '&:hover': {
              bgcolor: '#333',
            },
          }}
        >
          Add Buyer
        </Button>
      </Stack>

      {/* Snackbar Notifications */}
      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={clearAlerts}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={clearAlerts} 
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>

      {/* Table */}
      <TableContainer 
        component={Paper} 
        elevation={0} 
        sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#000' }} />
          </Box>
        ) : buyers.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <PeopleIcon sx={{ fontSize: 48, color: '#bdbdbd', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Buyers Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Get started by adding your first buyer.
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead sx={{ bgcolor: '#D4AF37' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#000', width: '60px', textAlign: 'center' }}>S.No</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#000' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#000' }}>Company Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#000' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#000' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#000' }}>Address</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#000', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {buyers.map((buyer, index) => (
                <TableRow 
                  key={buyer._id} 
                  hover
                  sx={{ '&:hover': { bgcolor: '#F4E3B2' } }}
                >
                  <TableCell sx={{ textAlign: 'center' }}>{index + 1}</TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar sx={{ bgcolor: '#000', width: 40, height: 40 }}>
                        {buyer.name.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">{buyer.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{buyer.companyName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{buyer.email || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{buyer.phone || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{buyer.address}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton
                        size="small"
                        onClick={() => handleShowModal(buyer)}
                        sx={{
                          color: '#000',
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(buyer._id)}
                        sx={{
                          color: '#d32f2f',
                          '&:hover': {
                            bgcolor: 'rgba(211, 47, 47, 0.04)',
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Modal Dialog */}
      <Dialog
        open={showModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
      >
        <DialogTitle sx={{ bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#000' }}>
              {editingBuyer ? 'Edit Buyer' : 'Add New Buyer'}
            </Typography>
            <IconButton onClick={handleCloseModal} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={2.5}>
              <TextField
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                fullWidth
                variant="outlined"
                placeholder="Enter buyer name"
              />
              <TextField
                label="Company Name"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                required
                fullWidth
                variant="outlined"
                placeholder="Enter company name"
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                placeholder="Enter email address"
              />
              <TextField
                label="Phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                placeholder="Enter phone number"
              />
              <TextField
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                placeholder="Enter full address"
              />
            </Stack>
          </DialogContent>
          
          <DialogActions sx={{ p: 2.5, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
            <Button
              onClick={handleCloseModal}
              variant="outlined"
              sx={{
                color: '#000',
                borderColor: '#e0e0e0',
                '&:hover': {
                  borderColor: '#000',
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: '#000',
                color: '#fff',
                '&:hover': {
                  bgcolor: '#333',
                },
              }}
            >
              {editingBuyer ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Buyers;