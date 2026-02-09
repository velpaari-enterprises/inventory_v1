import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import KeepAliveRoutes from './components/KeepAliveRoutes';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import Buyers from './pages/Buyers';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Inventory from './pages/Inventory';
import Combos from './pages/Combos';
import Reports from './pages/Reports';
import ProfitLoss from './pages/ProfitLoss';
import RTOProducts from './pages/RTOProducts';
import UploadedDataManagement from './pages/UploadedDataManagement';
import Login from './pages/Login';
import Settings from './pages/Settings';
import { AuthProvider, useAuth } from './context/AuthContext';

// Create MUI Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#000000',
    },
    secondary: {
      main: '#ffffff',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});

const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const routes = [
    { path: '/', element: <Dashboard /> },
    { path: '/vendors', element: <Vendors /> },
    { path: '/buyers', element: <Buyers /> },
    { path: '/categories', element: <Categories /> },
    { path: '/products', element: <Products /> },
    { path: '/combos', element: <Combos /> },
    { path: '/purchases', element: <Purchases /> },
    { path: '/sales', element: <Sales /> },
    { path: '/inventory', element: <Inventory /> },
    { path: '/reports', element: <Reports /> },
    { path: '/rto-products', element: <RTOProducts /> },
    {
      path: '/profit-loss',
      element: (
        <ProtectedRoute roles={['owner']}>
          <ProfitLoss />
        </ProtectedRoute>
      )
    },
    {
      path: '/uploaded-data',
      element: (
        <ProtectedRoute roles={['owner']}>
          <UploadedDataManagement />
        </ProtectedRoute>
      )
    },
    {
      path: '/settings',
      element: (
        <ProtectedRoute roles={['owner']}>
          <Settings />
        </ProtectedRoute>
      )
    },
    { path: '*', element: <Navigate to="/" replace /> }
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', margin: 0, padding: 0 }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          margin: 0,
          padding: 0,
        }}
      >
        <Header />
        <KeepAliveRoutes routes={routes} />
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;