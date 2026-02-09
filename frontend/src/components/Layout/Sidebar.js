import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  IconButton,
  Avatar,
  Tooltip,
  useTheme,
  useMediaQuery,
  Divider,
  Fade,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Store as StoreIcon,
  People as PeopleIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalMall as LocalMallIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  CloudDownload as CloudDownloadIcon,
  Undo as UndoIcon,
  Menu as MenuIcon,
  Home as HomeIcon,
  ShoppingBag as ShoppingBagIcon,
  TableChart as TableChartIcon,
  Settings as SettingsIcon,
  Collections as CollectionsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 80;

const Sidebar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user, logout } = useAuth();

  const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);
  const closeMobileSidebar = () => setMobileOpen(false);

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile) closeMobileSidebar();
  }, [location, isMobile]);

  const allNavItems = [
    // { path: '/', icon: <Box>Logo</Box>, text: 'Logo', isLogo: true },
    { path: '/', icon: <HomeIcon />, text: 'Dashboard' },
    { path: '/vendors', icon: <StoreIcon />, text: 'Vendors' },
    { path: '/buyers', icon: <PeopleIcon />, text: 'Buyers' },
    { path: '/categories', icon: <CategoryIcon />, text: 'Categories' },
    { path: '/products', icon: <ShoppingBagIcon />, text: 'Products' },
    { path: '/combos', icon: <CollectionsIcon />, text: 'Combos' },
    { path: '/purchases', icon: <ShoppingCartIcon />, text: 'Purchases' },
    { path: '/sales', icon: <LocalMallIcon />, text: 'Sales' },
    { path: '/inventory', icon: <InventoryIcon />, text: 'Inventory' },
    { path: '/reports', icon: <TableChartIcon />, text: 'Reports' },
    { path: '/profit-loss', icon: <TrendingUpIcon />, text: 'Profit & Loss', roles: ['owner'] },
    { path: '/uploaded-data', icon: <CloudDownloadIcon />, text: 'Uploaded Data', roles: ['owner'] },
    { path: '/rto-products', icon: <UndoIcon />, text: 'RTO/RPU' },
  ];

  // Filter items based on user role
  const navItems = allNavItems.filter(item => {
    if (item.roles && !item.roles.includes(user?.role)) {
      return false;
    }
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fafafa',
        borderRight: '1px solid #e0e0e0',
        overflowY: 'auto',
        overflowX: 'hidden',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        '-ms-overflow-style': 'none',
        'scrollbarWidth': 'none',
      }}
    >
      {/* Main Navigation */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 3 }}>
        <List sx={{ width: '100%', px: 1.5 }}>
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Fade in={true} timeout={300 + index * 50} key={item.path + index}>
                <ListItem disablePadding sx={{ mb: 2 }}>
                  <Tooltip title={item.text} placement="right" arrow>
                    <ListItemButton
                      onClick={() => navigate(item.path)}
                      sx={{
                        minHeight: 48,
                        justifyContent: 'center',
                        px: 0,
                        py: 1.5,
                        borderRadius: '15px',
                        width: 48,
                        height: 48,
                        mx: 'auto',
                        bgcolor: isActive ? '#000' : '#fff',
                        color: isActive ? '#fff' : '#000',
                        boxShadow: isActive
                          ? '0 4px 8px rgba(0,0,0,0.15)'
                          : '0 2px 4px rgba(0,0,0,0.08)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          bgcolor: isActive ? '#000' : '#f5f5f5',
                          transform: 'scale(1.05)',
                          boxShadow: isActive
                            ? '0 6px 12px rgba(0,0,0,0.2)'
                            : '0 4px 8px rgba(0,0,0,0.12)',
                        },
                      }}
                    >
                      {React.cloneElement(item.icon, {
                        sx: {
                          fontSize: 24,
                          color: isActive ? '#fff' : '#000',
                        },
                      })}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              </Fade>
            );
          })}
        </List>
      </Box>

      {/* Bottom Section - Settings and User */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 3, gap: 2 }}>
        <Divider sx={{ width: '60%', mb: 1 }} />

        {/* Settings Icon - Only for Owner */}
        {user?.role === 'owner' && (
          <Tooltip title="Settings" placement="right" arrow>
            <IconButton
              onClick={() => navigate('/settings')}
              sx={{
                width: 48,
                height: 48,
                bgcolor: location.pathname === '/settings' ? '#000' : '#fff',
                color: location.pathname === '/settings' ? '#fff' : '#000',
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: location.pathname === '/settings' ? '#000' : '#f5f5f5',
                  color: location.pathname === '/settings' ? '#fff' : '#000',
                  transform: 'scale(1.05)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
                },
              }}
            >
              <SettingsIcon sx={{ fontSize: 24 }} />
            </IconButton>
          </Tooltip>
        )}

        {/* Logout Icon */}
        <Tooltip title="Logout" placement="right" arrow>
          <IconButton
            onClick={handleLogout}
            sx={{
              width: 48,
              height: 48,
              bgcolor: '#fff',
              color: '#d32f2f',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: '#ffebee',
                transform: 'scale(1.05)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
              },
            }}
          >
            <LogoutIcon sx={{ fontSize: 24 }} />
          </IconButton>
        </Tooltip>

        {/* User Avatar */}
        <Tooltip title={`Profile (${user?.role})`} placement="right" arrow>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              cursor: 'pointer',
              bgcolor: user?.role === 'owner' ? '#D4AF37' : '#000',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
              },
            }}
            alt={user?.role?.toUpperCase()}
          >
            {user?.role?.charAt(0).toUpperCase()}
          </Avatar>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <IconButton
          onClick={toggleMobileSidebar}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1300,
            bgcolor: '#000',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '&:hover': {
              bgcolor: '#333',
            },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Desktop Drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              border: 'none',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={closeMobileSidebar}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;
