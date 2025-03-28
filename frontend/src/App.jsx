import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Authentication/Login";
import Register from "./pages/Authentication/Register";
import Home from "./pages/Home/Home";
import NotFound from "./pages/NotFound/NotFound";
import AppLayout from "./components/layout/Layout";
import Analysis from "./pages/Analysis/Analysis";
import ProtectedRoute from "/src/components/auth/ProtectedRoute";
import Tools from "./pages/Tools/Tools";
import Profile from "/src/pages/Profile/Profile";
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
          <Route path="/dashboard" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="analysis" element={<Analysis />} />
            <Route path="profile" element={<Profile />} />
            <Route path="tools" element={<Tools />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterAndLogout />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
