import React from 'react';
import { Box, Typography, Link, Container } from '@mui/material';

function Footer() {
  return (
    <Box sx={{ color: 'white', padding: '20px 0px' }} component="footer" bgcolor="primary.main">
      <Container maxWidth="lg">
        <Typography variant="body1" align="center" gutterBottom>
          &copy; {new Date().getFullYear()} VisoAI. All Rights Reserved.
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
          <Link href="#privacy" color="inherit" underline="hover">
            Privacy Policy
          </Link>
          <Link href="#terms" color="inherit" underline="hover">
            Terms of Service
          </Link>
          <Link href="#contact" color="inherit" underline="hover">
            Contact Us
          </Link>
        </Box>
      </Container>
    </Box>
  );
}

export default Footer;
