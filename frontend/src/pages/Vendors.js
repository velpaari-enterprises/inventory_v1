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
  Fade,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { vendorsAPI } from '../services/api';

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    contactPerson: '', 
    email: '', 
    phone: '', 
    address: '', 
    gstNo: '', 
    accountNo: '',
    ifscCode: '',
    bankName: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { 
    fetchVendors(); 
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await vendorsAPI.getAll();
      setVendors(response.data);
    } catch {
      setError('Failed to fetch vendors.');
    }
  };

  const handleShowModal = (vendor = null) => {
    setEditingVendor(vendor);
    setFormData(vendor || { 
      name: '', 
      contactPerson: '', 
      email: '', 
      phone: '', 
      address: '', 
      gstNo: '', 
      accountNo: '',
      ifscCode: '',
      bankName: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await vendorsAPI.update(editingVendor._id, formData);
        setSuccess('Vendor updated successfully!');
      } else {
        await vendorsAPI.create(formData);
        setSuccess('Vendor created successfully!');
      }
      fetchVendors();
      setShowModal(false);
    } catch {
      setError('Failed to save vendor.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this vendor?')) {
      try {
        await vendorsAPI.delete(id);
        setSuccess('Vendor deleted successfully!');
        fetchVendors();
      } catch {
        setError('Failed to delete vendor.');
      }
    }
  };

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: 'rgba(255, 255, 255, 0.85)', minHeight: '100vh' }}>
      {/* Page Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ color: '#000', fontWeight: 600, mb: 0.5 }}>
            Vendors Management
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
          Add Vendor
        </Button>
      </Stack>

      {/* Snackbar Notifications */}
      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
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
        <Table>
          <TableHead sx={{ bgcolor: '#D4AF37' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#000' }}>S.No</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#000' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#000' }}>Contact Person</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#000' }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#000' }}>Address</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#000' }}>GST No</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#000' }}>Account No</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#000', textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vendors.map((vendor, index) => (
              <TableRow 
                key={vendor._id} 
                hover
                sx={{ '&:hover': { bgcolor: '#F4E3B2' } }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>{vendor.name}</TableCell>
                <TableCell>{vendor.contactPerson}</TableCell>
                <TableCell>{vendor.phone}</TableCell>
                <TableCell>{vendor.address}</TableCell>
                <TableCell>{vendor.gstNo}</TableCell>
                <TableCell>{vendor.accountNo}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <IconButton
                      size="small"
                      onClick={() => handleShowModal(vendor)}
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
                      onClick={() => handleDelete(vendor._id)}
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
      </TableContainer>

      {/* Modal Dialog */}
      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
      >
        <DialogTitle sx={{ bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#000' }}>
              {editingVendor ? 'Edit Vendor' : 'Add Vendor'}
            </Typography>
            <IconButton onClick={() => setShowModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={2.5}>
              <TextField
                label="Company Name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Contact Person"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                required
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
               
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Address"
                name="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                fullWidth
                multiline
                rows={3}
                variant="outlined"
              />
              <TextField
                label="GST No"
                name="gstNo"
                value={formData.gstNo}
                onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })}
                required
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Account No"
                name="accountNo"
                value={formData.accountNo}
                onChange={(e) => setFormData({ ...formData, accountNo: e.target.value })}
                
                fullWidth
                variant="outlined"
              />
              <TextField
                label="IFSC Code"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Bank Name"
                name="bankName"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                fullWidth
                variant="outlined"
              />
            </Stack>
          </DialogContent>
          
          <DialogActions sx={{ p: 2.5, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
            <Button
              onClick={() => setShowModal(false)}
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
              {editingVendor ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Vendors;