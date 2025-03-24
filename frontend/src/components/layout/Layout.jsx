import { Outlet, Link } from "react-router-dom";
import Navigation from "./Navigation";
import Footer from "./Footer";
import "/src/styles/Layout.css";
import { Container } from "@mui/material";

function Layout() {
  return (
    <>
      <Navigation />
      <Container className="main-content">
        <Outlet />
      </Container>
      <Footer />
    </>
  );
}

export default Layout;
