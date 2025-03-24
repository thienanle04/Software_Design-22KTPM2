import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Authentication/Login";
import Register from "./pages/Authentication/Register";
import Home from "./pages/Home/Home";
import NotFound from "./pages/NotFound/NotFound";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "/src/components/auth/ProtectedRoute";
import { AuthProvider } from "/src/context/AuthContext";
import "/src/styles/App.css";

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route
              index
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/register" element={<RegisterAndLogout />} />
          <Route path="*" element={<NotFound />}></Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
