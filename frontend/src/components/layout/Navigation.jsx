import React, { useState, Link } from "react";
import { AppBar, Toolbar, IconButton, Typography, Button } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { useAuth } from "/src/context/AuthContext";
import { logout } from "/src/services/authService";

function Navigation() {
  const [open, setOpen] = useState(false); // Controls sidebar visibility
  const { IsAuthenticated, setIsAuthenticated } = useAuth();

  const toggleDrawer = () => {
    setOpen(!open); // Toggle sidebar open/close
  };

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
            VisoAI
          </Typography>

          {IsAuthenticated ? (
            <Button color="inherit" onClick={() => logout(setIsAuthenticated)}>
              Logout
            </Button>
          ) : (
            <Button color="inherit" component={Link} to="/login">
              Login
            </Button>
          )}

        </Toolbar>
      </AppBar>
    </>
  );
}

export default Navigation;
