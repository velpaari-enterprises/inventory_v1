import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import logo from '../../logo.jpeg';

const Header = () => {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        top: 0,
        left: 0,
        right: 0,
        margin: 0,
        padding: 0,
      }}
    >
      <Toolbar sx={{ justifyContent: 'center', minHeight: 'auto', padding: '8px 16px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <img 
            src={logo} 
            alt="Velpaari Logo" 
            style={{
              width: '100px',
              height: '100px',
              objectFit:'fill',
              borderRadius:'20px',
            }}
            onError={(e) => {
              e.target.style.display='none';
            }}
          />
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                color: '#D4AF37',
                fontWeight: 700,
                fontSize: '1.5rem',
                letterSpacing: '0.1em',
                lineHeight: 1.2
              }}
            >
              VELPAARI ENTERPRISES
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#000',
                fontSize: '0.65rem',
                letterSpacing: '0.15em',
                fontWeight: 500,
                display: 'block'
              }}
            >
              FROM EVERYDAY TO EXCLUSIVE
            </Typography>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;