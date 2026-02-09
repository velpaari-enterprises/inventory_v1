"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { purchasesAPI } from '../services/api';

function PurchaseOrder({ vendors = [], items = [] }) {
    // Mode state: 'list', 'create', or 'view'
    const [mode, setMode] = useState('list');
    const [purchaseHistory, setPurchaseHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    // Formatters
    const formatIndianNumber = (num) => {
        if (num === undefined || num === null) return '0.00';
        const number = typeof num === 'string' ? parseFloat(num) : num;
        if (isNaN(number)) return '0.00';
        return number.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Fetch history
    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await purchasesAPI.getAll();
            setPurchaseHistory(res.data);
        } catch (err) {
            console.error("Error fetching purchase history:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mode === 'list') {
            fetchHistory();
        }
    }, [mode]);

    // Declare hooks only once at the top
    const [selectedVendorId, setSelectedVendorId] = useState("");
    const [selectedItemId, setSelectedItemId] = useState("");
    const [formData, setFormData] = useState({
        companyName: "VELPAARI ENTERPRISES",
        streetAddress: "5/3, 32b Pasumai Nagar, Thiruchengode Main Road, Alampalayam (PO)",
        cityStateZip: " Erode, TamilNadu - 638008",
        phone: "9500791500",
        date: new Date().toISOString().split('T')[0], // Use ISO date for input
        poNumber: "",
        vendorCompany: "",
        vendorContact: "",
        vendorAddress: "",
        vendorCityStateZip: "",
        vendorPhone: "",
        vendorEmail: "",
        vendorGstNo: "",
        vendorAccountNo: "",
        shipToName: "VELPAARI ENTERPRISES ",
        shipToCompany: "VELPAARI ENTERPRISES",
        shipToAddress: "5/3, 32b Pasumai Nagar, Thiruchengode Main Road, Alampalayam (PO)",
        shipToCityStateZip: "Erode, TamilNadu - 638008",
        shipToPhone: "9500791500",
        items: [],
        subtotal: 0,
        tax: 0,
        taxAmount: 0,
        shipping: 0,
        shippingNotes: "",
        other: 0,
        otherNotes: "",
        total: 0,
        comments: "",
        contactName: "",
        contactPhone: "",
        contactEmail: "",
    });

    const [newItem, setNewItem] = useState({
        itemId: "",
        barcodeId: "",
        description: "",
        quantity: 1,
        costPrice: 0,
        sellingPrice: 0,
        gstPercent: 0,
        itemTotal: 0,
        gstAmount: 0,
        total: 0,
    });

    const [manualItemEntry, setManualItemEntry] = useState(false);

    useEffect(() => {
        const subtotal = formData.items.reduce((sum, item) => sum + item.itemTotal, 0);
        const gstTotal = formData.items.reduce((sum, item) => sum + item.gstAmount, 0);
        const total = subtotal + gstTotal + Number(formData.shipping) + Number(formData.other);
        
        setFormData((prev) => ({
            ...prev,
            subtotal,
            gstTotal,
            total,
        }));
    }, [formData.items, formData.shipping, formData.other]);

    const viewPurchase = (purchase) => {
        setFormData({
            companyName: "VELPAARI ENTERPRISES",
            streetAddress: "5/3, 32b Pasumai Nagar, Thiruchengode Main Road, Alampalayam (PO)",
            cityStateZip: " Erode, TamilNadu - 638008",
            phone: "9500791500",
            date: purchase.purchaseDate ? new Date(purchase.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            poNumber: purchase.purchaseId || "",
            // Vendor
            vendorCompany: purchase.vendor?.name || "",
            vendorContact: purchase.vendor?.contactPerson || "",
            vendorAddress: purchase.vendor?.address || "",
            vendorCityStateZip: "",
            vendorPhone: purchase.vendor?.phone || "",
            vendorEmail: purchase.vendor?.email || "",
            vendorGstNo: purchase.vendor?.gstNo || "",
            vendorAccountNo: purchase.vendor?.accountNo || "",
            // Ship To
            shipToName: "VELPAARI ENTERPRISES ",
            shipToCompany: "VELPAARI ENTERPRISES",
            shipToAddress: "5/3, 32b Pasumai Nagar, Thiruchengode Main Road, Alampalayam (PO)",
            shipToCityStateZip: "Erode, TamilNadu - 638008",
            shipToPhone: "9500791500",
            // Items
            items: purchase.items.map(i => ({
                itemId: i.product?._id || "",
                barcodeId: i.product?.barcode || "",
                description: i.product?.name || "Item",
                quantity: i.quantity,
                costPrice: i.unitCost, 
                sellingPrice: 0, 
                gstPercent: 0,
                itemTotal: i.total, 
                gstAmount: 0, 
                total: i.total,
            })),
            subtotal: purchase.totalAmount,
            gstTotal: 0,
            tax: 0,
            taxAmount: 0,
            shipping: 0,
            shippingNotes: "",
            other: 0,
            otherNotes: "",
            total: purchase.totalAmount,
            comments: "",
            contactName: "",
            contactPhone: "",
            contactEmail: "",
        });
        setMode('view');
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleVendorSelect = (vendorId) => {
        setSelectedVendorId(vendorId);
        const vendor = vendors.find((v) => v._id === vendorId);
        if (vendor) {
            setFormData((prev) => ({
                ...prev,
                vendorCompany: vendor.name,
                vendorContact: vendor.contactPerson,
                vendorAddress: vendor.address,
                vendorPhone: vendor.phone,
                vendorEmail: vendor.email,
                vendorGstNo: vendor.gstNo,
                vendorAccountNo: vendor.accountNo,
            }));
        }
    };

    const handleItemSelect = (itemId) => {
        setSelectedItemId(itemId);
        const item = items.find((i) => i._id === itemId);
        if (item) {
            // Use current values from DB as default
            const currentCost = item.costPrice || item.price || 0;
            const currentSelling = item.sellingPrice || item.price || 0;
            
            setNewItem((prev) => ({
                ...prev,
                itemId: item._id,
                barcodeId: item.barcodeId || item.barcode || "", // Get barcode ID from item
                description: item.name,
                costPrice: currentCost,
                sellingPrice: currentSelling,
                gstPercent: item.gstPercent || 0,
            }));
            calculateItemTotals({
                ...newItem,
                itemId: item._id,
                barcodeId: item.barcodeId || item.barcode || "",
                description: item.name,
                costPrice: currentCost,
                sellingPrice: currentSelling,
                gstPercent: item.gstPercent || 0,
            });
        }
    };

    const calculateItemTotals = (item) => {
        const itemTotal = item.quantity * item.costPrice;
        const gstAmount = itemTotal * (item.gstPercent / 100);
        const total = itemTotal + gstAmount;
        
        setNewItem((prev) => ({ 
            ...prev, 
            itemTotal,
            gstAmount,
            total
        }));
    };

    const addItem = () => {
        if (newItem.description) {
            setFormData((prev) => ({
                ...prev,
                items: [...prev.items, {...newItem}],
            }));
            setNewItem({
                itemId: manualItemEntry ? "MANUAL" : "",
                barcodeId: "",
                description: "",
                quantity: 1,
                costPrice: 0,
                sellingPrice: 0,
                gstPercent: 0,
                itemTotal: 0,
                gstAmount: 0,
                total: 0,
            });
            setSelectedItemId("");
        }
    };

    const removeItem = (index) => {
        setFormData((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    };

    const handleSavePurchase = async () => {
        if (formData.items.length === 0) {
            alert("Please add items to the purchase order.");
            return;
        }
        if (!selectedVendorId) {
            alert("Please select a vendor.");
            return;
        }

        try {
            const purchaseData = {
                vendor: selectedVendorId,
                purchaseDate: formData.date,
                items: formData.items.map(item => ({
                    product: item.itemId !== "MANUAL" ? item.itemId : null, // Handle manual items if necessary?
                    quantity: item.quantity,
                    unitCost: item.costPrice, // Map back to what backend expects
                    sellingPrice: item.sellingPrice
                })),
                totalAmount: formData.total
            };

            await purchasesAPI.create(purchaseData);
            alert("Purchase Order saved successfully!");
            setFormData({
                companyName: "VELPAARI ENTERPRISES",
                streetAddress: "5/3, 32b Pasumai Nagar, Thiruchengode Main Road, Alampalayam (PO)",
                cityStateZip: " Erode, TamilNadu - 638008",
                phone: "9500791500",
                date: new Date().toISOString().split('T')[0],
                poNumber: "",
                vendorCompany: "",
                vendorContact: "",
                vendorAddress: "",
                vendorCityStateZip: "",
                vendorPhone: "",
                vendorEmail: "",
                vendorGstNo: "",
                vendorAccountNo: "",
                shipToName: "VELPAARI ENTERPRISES ",
                shipToCompany: "VELPAARI ENTERPRISES",
                shipToAddress: "5/3, 32b Pasumai Nagar, Thiruchengode Main Road, Alampalayam (PO)",
                shipToCityStateZip: "Erode, TamilNadu - 638008",
                shipToPhone: "9500791500",
                items: [],
                subtotal: 0,
                tax: 0,
                taxAmount: 0,
                shipping: 0,
                shippingNotes: "",
                other: 0,
                otherNotes: "",
                total: 0,
                comments: "",
                contactName: "",
                contactPhone: "",
                contactEmail: "",
            }); 
            setSelectedVendorId("");
            setMode("list"); // Go back to list
        } catch (error) {
            console.error("Error saving purchase order:", error);
            const errorMessage = error.response?.data?.message || "Failed to save purchase order.";
            alert(`Error: ${errorMessage}`);
        }
    };

    const downloadPurchaseOrder = (dataToPrint = formData) => {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Purchase Order - ${dataToPrint.poNumber || 'New'}</title>
                    <style>
                        body { font-family: "Times New Roman", Times, serif; margin: 20px; }
                        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                        .logo { width: 60px; height: 60px; border-radius: 50%; margin-right: 15px; vertical-align: top; display: inline-block; object-fit: cover; }
                        .title { color: red; font-size: 24px; font-weight: bold; text-align: center; }
                        .info-section { display: flex; justify-content: space-between; margin: 20px 0; }
                        .info-box { border: 2px solid red; padding: 10px; width: 45%; }
                        .info-header { background: red; color: white; padding: 5px; margin: -10px -10px 10px -10px; font-weight: bold; }
                        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        .table th, .table td { border: 1px solid red; padding: 8px; text-align: left; }
                        .table th { background: red; color: white; }
                        .totals { text-align: right; margin: 20px 0; }
                        .total-row { font-weight: bold; background: #ffeb3b; }
                        .comments { border: 2px solid red; padding: 10px; margin: 20px 0; }
                        .comments-header { background: red; color: white; padding: 5px; margin: -10px -10px 10px -10px; }
                        .footer { text-align: center; margin-top: 30px; }
                        .notes { font-style: italic; color: #555; margin-top: 5px; font-size: 0.9em; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <img src="/logo_vp.jpeg" alt="Velpaari Enterprises Logo" class="logo">
                            <div><strong>${dataToPrint.companyName || "VELPAARI ENTERPRISES"}</strong></div>
                            <div>${dataToPrint.streetAddress || "5/3, 32b Pasumai Nagar, Thiruchengode Main Road, Alampalayam (PO)"}</div>
                            <div>${dataToPrint.cityStateZip || "Erode, TamilNadu - 638008"}</div>
                            <div>Phone: ${dataToPrint.phone || "9500791500"}</div>
                        </div>
                        <div>
                            <div class="title">Purchase Order</div>
                            <div style="text-align: right; margin-top: 10px;">
                                <div>DATE: ${dataToPrint.date ? new Date(dataToPrint.date).toLocaleDateString() : ''}</div>
                                <div>PO #: ${dataToPrint.poNumber || ''}</div>
                            </div>
                        </div>
                    </div>

                    <div class="info-section">
                        <div class="info-box">
                            <div class="info-header">VENDOR</div>
                            <div>${dataToPrint.vendorCompany || (dataToPrint.vendor?.name) || ''}</div>
                            <div>Contact: ${dataToPrint.vendorContact || (dataToPrint.vendor?.contactPerson) || ''}</div>
                            <div>${dataToPrint.vendorAddress || ''}</div>
                            <div>Phone: ${dataToPrint.vendorPhone || ''}</div>
                        </div>
                        <div class="info-box">
                            <div class="info-header">SHIP TO</div>
                            <div>${dataToPrint.shipToName || "VELPAARI ENTERPRISES"}</div>
                            <div>${dataToPrint.shipToCompany || "VELPAARI ENTERPRISES"}</div>
                            <div>${dataToPrint.shipToAddress || "5/3, 32b Pasumai Nagar..."}</div>
                        </div>
                    </div>

                    <table class="table">
                        <tr>
                            <th>DESCRIPTION</th>
                            <th>QTY</th>
                            <th>UNIT PRICE</th>
                            <th>TOTAL</th>
                        </tr>
                        ${dataToPrint.items?.map((item) => `
                            <tr>
                                <td>${item.description || item.product?.name || 'Item'}</td>
                                <td>${item.quantity}</td>
                                <td>₹ ${formatIndianNumber(item.unitCost || item.unitPrice || 0)}</td>
                                <td>₹ ${formatIndianNumber(item.total || (item.quantity * (item.unitCost || 0)))}</td>
                            </tr>
                        `).join("")}
                    </table>

                    <div class="totals">
                        <div class="total-row">GRAND TOTAL: ₹ ${formatIndianNumber(dataToPrint.totalAmount || dataToPrint.total)}</div>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
             setTimeout(() => {
                printWindow.print();
            }, 500);
        }
    };

    const downloadHistoryItem = async (purchase) => {
        // Reuse the print logic with the purchase data
        const mappedData = {
           ...purchase,
           date: purchase.purchaseDate,
           items: purchase.items.map(i => ({
               description: i.product?.name || "Product",
               quantity: i.quantity,
               unitCost: i.unitCost, 
               total: i.total
           })),
           vendorCompany: purchase.vendor?.name,
           vendorContact: purchase.vendor?.contactPerson,
        };
        downloadPurchaseOrder(mappedData);
    };

    if (mode === 'list') {
        return (
            <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#D4AF37' }}>
                        Purchase History
                    </Typography>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />}
                        onClick={() => setMode('create')}
                        sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#333' } }}
                    >
                        New Purchase
                    </Button>
                </Stack>

                <Paper sx={{ width: '100%', overflow: 'hidden', border: '1px solid #D4AF37' }}>
                    <TableContainer sx={{ maxHeight: 640 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ bgcolor: '#000', color: '#D4AF37', fontWeight: 'bold' }}>Date</TableCell>
                                    <TableCell sx={{ bgcolor: '#000', color: '#D4AF37', fontWeight: 'bold' }}>PO Number</TableCell>
                                    <TableCell sx={{ bgcolor: '#000', color: '#D4AF37', fontWeight: 'bold' }}>Vendor</TableCell>
                                    <TableCell sx={{ bgcolor: '#000', color: '#D4AF37', fontWeight: 'bold' }}>Items</TableCell>
                                    <TableCell sx={{ bgcolor: '#000', color: '#D4AF37', fontWeight: 'bold' }}>Total Amount</TableCell>
                                    <TableCell sx={{ bgcolor: '#000', color: '#D4AF37', fontWeight: 'bold' }} align="center">Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {purchaseHistory.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                            No purchase history found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    purchaseHistory.map((purchase) => (
                                        <TableRow hover key={purchase._id || purchase.purchaseId}>
                                            <TableCell>{formatDate(purchase.purchaseDate)}</TableCell>
                                            <TableCell>{purchase.purchaseId || 'N/A'}</TableCell>
                                            <TableCell>{purchase.vendor?.name || 'Unknown'}</TableCell>
                                            <TableCell>{purchase.items?.length || 0}</TableCell>
                                            <TableCell>₹ {formatIndianNumber(purchase.totalAmount)}</TableCell>
                                            <TableCell align="center">
                                                <IconButton 
                                                    onClick={() => viewPurchase(purchase)}
                                                    sx={{ color: '#000', mr: 1 }}
                                                    title="View Details"
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                                <IconButton 
                                                    onClick={() => downloadHistoryItem(purchase)}
                                                    sx={{ color: '#000' }}
                                                    title="Download"
                                                >
                                                    <DownloadIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', p: 3 }}>
             <Stack direction="row" justifyContent="flex-start" alignItems="center" sx={{ mb: 2 }}>
                <Button onClick={() => setMode('list')} sx={{ color: '#000' }}>
                    &larr; Back to History
                </Button>
            </Stack>

            <Typography variant="h4" sx={{ fontWeight: 600, mb: 3, textAlign: 'center', color: '#D4AF37' }}>
                {mode === 'view' ? 'Purchase Order Details' : 'New Purchase Order'}
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                {/* Existing form content continues below... */}
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Company Information
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Company Name"
                            value={formData.companyName}
                            onChange={(e) => handleInputChange("companyName", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Street Address"
                            value={formData.streetAddress}
                            onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="City, State ZIP"
                            value={formData.cityStateZip}
                            onChange={(e) => handleInputChange("cityStateZip", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Order Information
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            type="date"
                            label="Date"
                            value={formData.date}
                            onChange={(e) => handleInputChange("date", e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="PO Number (Manual Entry)"
                            value={formData.poNumber}
                            onChange={(e) => handleInputChange("poNumber", e.target.value)}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Vendor Information
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth sx={{ minWidth: "200px" }}>
                            <InputLabel>Select Vendor</InputLabel>
                            <Select
                                value={selectedVendorId}
                                onChange={(e) => handleVendorSelect(e.target.value)}
                                label="Select Vendor"
                            >
                                <MenuItem value="">Select Vendor</MenuItem>
                                {vendors && vendors.map((vendor) => (
                                    <MenuItem key={vendor._id} value={vendor._id}>
                                        {vendor.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Contact Person"
                            value={formData.vendorContact}
                            onChange={(e) => handleInputChange("vendorContact", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Vendor Address"
                            value={formData.vendorAddress}
                            onChange={(e) => handleInputChange("vendorAddress", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Phone"
                            value={formData.vendorPhone}
                            onChange={(e) => handleInputChange("vendorPhone", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="GST No"
                            value={formData.vendorGstNo}
                            onChange={(e) => handleInputChange("vendorGstNo", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Account No"
                            value={formData.vendorAccountNo}
                            onChange={(e) => handleInputChange("vendorAccountNo", e.target.value)}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Ship To Information
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Name"
                            value={formData.shipToName}
                            onChange={(e) => handleInputChange("shipToName", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Company Name"
                            value={formData.shipToCompany}
                            onChange={(e) => handleInputChange("shipToCompany", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Street Address"
                            value={formData.shipToAddress}
                            onChange={(e) => handleInputChange("shipToAddress", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="City, State ZIP"
                            value={formData.shipToCityStateZip}
                            onChange={(e) => handleInputChange("shipToCityStateZip", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Phone"
                            value={formData.shipToPhone}
                            onChange={(e) => handleInputChange("shipToPhone", e.target.value)}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {mode !== 'view' && (
            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Add Items
                </Typography>
                
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={manualItemEntry}
                            onChange={(e) => setManualItemEntry(e.target.checked)}
                        />
                    }
                    label="Manual Item Entry"
                    sx={{ mb: 2 }}
                />
                
                <Grid container spacing={2}>
                    {!manualItemEntry ? (
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth sx={{ minWidth: "200px" }}>
                                <InputLabel>Select Product</InputLabel>
                                <Select
                                    value={selectedItemId}
                                    onChange={(e) => handleItemSelect(e.target.value)}
                                    label="Select Product"
                                >
                                    <MenuItem value="">Select Product</MenuItem>
                                    {items && items.map((item) => (
                                        <MenuItem key={item._id} value={item._id}>
                                            {item.name} {item.barcodeId ? `(Barcode: ${item.barcodeId})` : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    ) : (
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Barcode ID"
                                value={newItem.barcodeId}
                                onChange={(e) => {
                                    setNewItem((prev) => ({ ...prev, barcodeId: e.target.value }));
                                    calculateItemTotals({...newItem, barcodeId: e.target.value});
                                }}
                            />
                        </Grid>
                    )}
                    
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Description"
                            value={newItem.description}
                            onChange={(e) => {
                                setNewItem((prev) => ({ ...prev, description: e.target.value }));
                                calculateItemTotals({...newItem, description: e.target.value});
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Quantity"
                            value={newItem.quantity}
                            onChange={(e) => {
                                const quantity = Number.parseInt(e.target.value) || 1;
                                setNewItem((prev) => ({ ...prev, quantity }));
                                calculateItemTotals({...newItem, quantity});
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Cost Price"
                            value={newItem.costPrice}
                            onChange={(e) => {
                                const costPrice = Number.parseFloat(e.target.value) || 0;
                                setNewItem((prev) => ({ ...prev, costPrice }));
                                calculateItemTotals({...newItem, costPrice});
                            }}
                            inputProps={{ step: "0.01" }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Selling Price"
                            value={newItem.sellingPrice}
                            onChange={(e) => {
                                const sellingPrice = Number.parseFloat(e.target.value) || 0;
                                setNewItem((prev) => ({ ...prev, sellingPrice }));
                            }}
                            inputProps={{ step: "0.01" }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            type="number"
                            label="GST %"
                            value={newItem.gstPercent}
                            onChange={(e) => {
                                const gstPercent = Number.parseFloat(e.target.value) || 0;
                                setNewItem((prev) => ({ ...prev, gstPercent }));
                                calculateItemTotals({...newItem, gstPercent});
                            }}
                            inputProps={{ step: "0.01" }}
                        />
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Card sx={{ bgcolor: '#fafafa', border: '1px solid #e0e0e0' }}>
                            <CardContent>
                                <Typography variant="body2" sx={{ mb: 1 }}>Barcode ID: {newItem.barcodeId || "N/A"}</Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>Item Total: ₹ {formatIndianNumber(newItem.quantity * newItem.costPrice)}</Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>GST Amount: ₹ {formatIndianNumber(newItem.quantity * newItem.costPrice * (newItem.gstPercent / 100))}</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>Total: ₹ {formatIndianNumber(newItem.total)}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={addItem}
                            sx={{
                                bgcolor: '#000',
                                textTransform: 'none',
                                '&:hover': { bgcolor: '#333' }
                            }}
                        >
                            Add Item
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
            )}

            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Items in Purchase Order
                </Typography>
                {formData.items.length === 0 ? (
                    <Typography sx={{ color: '#666', textAlign: 'center', py: 3 }}>
                        No items added yet.
                    </Typography>
                ) : (
                    <TableContainer sx={{ 
                        border: '1px solid #e0e0e0',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                            height: '8px'
                        },
                        '&::-webkit-scrollbar-track': {
                            background: '#f1f1f1',
                            borderRadius: '4px'
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: '#888',
                            borderRadius: '4px',
                            '&:hover': {
                                background: '#555'
                            }
                        }
                    }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#D4AF37' }}>
                                    <TableCell sx={{ fontWeight: 600, color: '#000' }}>Barcode ID</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#000' }}>Description</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#000' }}>Qty</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#000' }}>Cost Price</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#000' }}>Selling Price</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#000' }}>GST %</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#000' }}>Item Total</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#000' }}>GST Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#000' }}>Total</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#000' }} align="center">Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {formData.items.map((item, index) => (
                                    <TableRow key={index} sx={{ '&:hover': { bgcolor: '#F4E3B2' } }}>
                                        <TableCell>{item.barcodeId || item.itemId}</TableCell>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>₹ {formatIndianNumber(item.costPrice)}</TableCell>
                                        <TableCell>₹ {formatIndianNumber(item.sellingPrice)}</TableCell>
                                        <TableCell>{item.gstPercent}%</TableCell>
                                        <TableCell>₹ {formatIndianNumber(item.itemTotal)}</TableCell>
                                        <TableCell>₹ {formatIndianNumber(item.gstAmount)}</TableCell>
                                        <TableCell>₹ {formatIndianNumber(item.total)}</TableCell>
                                        <TableCell align="center">
                                            {mode !== 'view' && (
                                            <IconButton
                                                size="small"
                                                onClick={() => removeItem(index)}
                                                sx={{ color: '#d32f2f' }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Totals
                </Typography>
                <Box sx={{ bgcolor: '#fafafa', p: 2, borderRadius: 1 }}>
                    <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" sx={{ pb: 1, borderBottom: '1px dashed #ddd' }}>
                            <Typography sx={{ fontWeight: 600 }}>Subtotal:</Typography>
                            <Typography>₹ {formatIndianNumber(formData.subtotal)}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" sx={{ pb: 1, borderBottom: '1px dashed #ddd' }}>
                            <Typography sx={{ fontWeight: 600 }}>GST Total:</Typography>
                            <Typography>₹ {formatIndianNumber(formData.gstTotal)}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" sx={{ pb: 1, borderBottom: '1px dashed #ddd' }}>
                            <Typography sx={{ fontWeight: 600 }}>Shipping:</Typography>
                            <Box sx={{ textAlign: 'right' }}>
                                <TextField
                                    type="number"
                                    size="small"
                                    value={formData.shipping}
                                    onChange={(e) => {
                                        handleInputChange("shipping", Number.parseFloat(e.target.value) || 0);
                                    }}
                                    inputProps={{ step: "0.01" }}
                                    sx={{ width: '100px', mb: 1 }}
                                />
                                <TextField
                                    size="small"
                                    placeholder="Shipping notes"
                                    multiline
                                    rows={2}
                                    value={formData.shippingNotes}
                                    onChange={(e) => handleInputChange("shippingNotes", e.target.value)}
                                    sx={{ width: '200px' }}
                                />
                            </Box>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" sx={{ pb: 1, borderBottom: '1px dashed #ddd' }}>
                            <Typography sx={{ fontWeight: 600 }}>Other:</Typography>
                            <Box sx={{ textAlign: 'right' }}>
                                <TextField
                                    type="number"
                                    size="small"
                                    value={formData.other}
                                    onChange={(e) => {
                                        handleInputChange("other", Number.parseFloat(e.target.value) || 0);
                                    }}
                                    inputProps={{ step: "0.01" }}
                                    sx={{ width: '100px', mb: 1 }}
                                />
                                <TextField
                                    size="small"
                                    placeholder="Other charges notes"
                                    multiline
                                    rows={2}
                                    value={formData.otherNotes}
                                    onChange={(e) => handleInputChange("otherNotes", e.target.value)}
                                    sx={{ width: '200px' }}
                                />
                            </Box>
                        </Stack>
                        <Stack 
                            direction="row" 
                            justifyContent="space-between" 
                            sx={{ pt: 2, borderTop: '2px solid #000' }}
                        >
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>Grand Total:</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>₹ {formatIndianNumber(formData.total)}</Typography>
                        </Stack>
                    </Stack>
                </Box>
            </Paper>

            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Contact Information
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Contact Name"
                            value={formData.contactName}
                            onChange={(e) => handleInputChange("contactName", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Contact Phone"
                            value={formData.contactPhone}
                            onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            type="email"
                            label="Contact Email"
                            value={formData.contactEmail}
                            onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadPurchaseOrder()}
                    sx={{
                        bgcolor: '#000',
                        color: '#fff',
                        textTransform: 'none',
                        px: 4,
                        py: 1.5,
                        '&:hover': { bgcolor: '#333' }
                    }}
                >
                    Download Purchase Order
                </Button>
                {mode !== 'view' && (
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    onClick={handleSavePurchase}
                    sx={{
                        bgcolor: '#D4AF37',
                        color: '#000',
                        textTransform: 'none',
                        px: 4,
                        py: 1.5,
                        ml: 2,
                        '&:hover': { bgcolor: '#C9A227' }
                    }}
                >
                    Save Purchase Order
                </Button>
                )}
            </Box>
        </Box>
    );
}

export default PurchaseOrder;
