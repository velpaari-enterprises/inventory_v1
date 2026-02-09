import axios from 'axios';
//base
// const API_BASE_URL = "https://inventory-management-yeso.onrender.com/api";
const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Vendors API using
export const vendorsAPI = {
  getAll: () => api.get('/vendors'),
  getById: (id) => api.get(`/vendors/${id}`),
  create: (data) => api.post('/vendors', data),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  delete: (id) => api.delete(`/vendors/${id}`),
};

// Buyers API
export const buyersAPI = {
  getAll: () => api.get('/buyers'),
  getById: (id) => api.get(`/buyers/${id}`),
  create: (data) => api.post('/buyers', data),
  update: (id, data) => api.put(`/buyers/${id}`, data),
  delete: (id) => api.delete(`/buyers/${id}`),
};

// Products API
export const productsAPI = {
  getAll: () => api.get('/products'),
  getLowStock: () => api.get('/products/low-stock'),
  getById: (id) => api.get(`/products/${id}`),
  getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  getBarcodeImage: (barcode) => api.get(`/barcode/${barcode}/barcode-image`, {
    responseType: 'blob'
  }),
  filterByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  getRTOProducts: (status) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    return api.get(`/products/rto/all?${params.toString()}`);
  },
  updateRTOStatus: (id, data) => api.put(`/products/${id}/rto-status`, data),
  create: (data) => {
    // Create FormData for file upload
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'photo' && data[key]) {
        formData.append('photo', data[key]);
      } else if (key !== 'photo') {
        formData.append(key, data[key]);
      }
    });

    return api.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  update: (id, data) => {
    // Create FormData for file upload
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'photo' && data[key]) {
        formData.append('photo', data[key]);
      } else if (key !== 'photo') {
        formData.append(key, data[key]);
      }
    });

    return api.put(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  delete: (id) => api.delete(`/products/${id}`),
};

// Purchases API
export const purchasesAPI = {
  getAll: () => api.get('/purchases'),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  getBarcodes: (id) => api.get(`/purchases/${id}/barcodes`),
  getInvoice: (id) => api.get(`/purchases/${id}/invoice`, { responseType: 'blob' }),
};

// Sales API
export const salesAPI = {
  getAll: () => api.get('/sales'),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  delete: (id) => api.delete(`/sales/${id}`),
  scanBarcode: (data) => api.post('/sales/scan', data),
  authenticateEdit: (password) => api.post('/sales/authenticate-edit', { password }),
  getInvoice: (id) => api.get(`/sales/${id}/invoice`, { responseType: 'blob' }),
};

// Barcodes API
export const barcodesAPI = {
  getByBarcode: (barcode) => api.get(`/barcodes/${barcode}`),
  generate: (productItemId) => api.get(`/barcodes/product-item/${productItemId}`),
  downloadProductBarcodes: (productIds) => {
    return api.post('/barcode/products/bulk-download', { productIds }, {
      responseType: 'blob'
    });
  },
  downloadComboBarcodes: (comboIds) => {
    return api.post('/barcode/combos/bulk-download', { comboIds }, {
      responseType: 'blob'
    });
  },
};

// Returns API
export const returnsAPI = {
  getAll: () => api.get('/returns'),
  getById: (id) => api.get(`/returns/${id}`),
  create: (data) => api.post('/returns', data),
  update: (id, data) => api.put(`/returns/${id}`, data),
  delete: (id) => api.delete(`/returns/${id}`),
  getByCategory: (category) => api.get(`/returns/category/${category}`),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  getNextCode: () => api.get('/categories/next-code'),
};

// Combos API
export const combosAPI = {
  getAll: () => api.get('/combos'),
  getById: (id) => api.get(`/combos/${id}`),
  getByBarcode: (barcode) => api.get(`/combos/barcode/${barcode}`),
  create: (formData) => {
    return api.post('/combos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, formData) => {
    return api.put(`/combos/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id) => api.delete(`/combos/${id}`),
  addProduct: (id, data) => api.post(`/combos/${id}/add-product`, data),
};

// Product Masters API (Excel Upload)
export const productMastersAPI = {
  uploadExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/product-masters/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Reports API
export const reportsAPI = {
  getPurchaseSalesData: (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/reports/purchase-sales?${params.toString()}`);
  },
  getProductMonthlyData: (productId, startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/reports/product/${productId}/monthly?${params.toString()}`);
  },
  getProductsList: () => api.get('/reports/products/list'),
  getProductStatusData: (productId) => api.get(`/reports/product-status/${productId}`),
  lookupCombos: (skus) => api.post('/reports/combos-lookup', { skus }),
};

// Profit & Loss API
export const profitLossAPI = {
  getProfitLoss: (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/profit-loss?${params.toString()}`);
  },
  uploadExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/profit-loss/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getUploadedData: () => api.get('/profit-loss/uploaded-data'),
  exportExcel: (data) => {
    // This is handled client-side
    return data;
  },
};

// RTO/RPU Products API
export const rtoProductsAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    return api.get(`/rto-products?${params.toString()}`);
  },
  getById: (id) => api.get(`/rto-products/${id}`),
  create: (data) => api.post('/rto-products', data),
  update: (id, data) => api.put(`/rto-products/${id}`, data),
  delete: (id) => api.delete(`/rto-products/${id}`),
  getSummary: () => api.get('/rto-products/stats/summary'),
};

// Uploaded Profit Sheets API
export const uploadedProfitSheetsAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    return api.get(`/uploaded-profit-sheets?${params.toString()}`);
  },
  getById: (id) => api.get(`/uploaded-profit-sheets/${id}`),
  create: (data) => api.post('/uploaded-profit-sheets', data),
  update: (id, data) => api.put(`/uploaded-profit-sheets/${id}`, data),
  delete: (id) => api.delete(`/uploaded-profit-sheets/${id}`),
  updateRow: (sheetId, rowId, data) => api.put(`/uploaded-profit-sheets/${sheetId}/rows/${rowId}`, data),
  deleteRow: (sheetId, rowId) => api.delete(`/uploaded-profit-sheets/${sheetId}/rows/${rowId}`),
  addRow: (sheetId, data) => api.post(`/uploaded-profit-sheets/${sheetId}/rows`, data),
  getSummary: () => api.get('/uploaded-profit-sheets/stats/summary'),
};

// Global Deductions API
export const globalDeductionsAPI = {
  getAll: () => api.get('/global-deductions'),
  create: (data) => api.post('/global-deductions', data),
  delete: (id) => api.delete(`/global-deductions/${id}`),
};

export default api;
