import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Authentication/Login";
import Register from "./pages/Authentication/Register";
import MyProjects from "./pages/Projects/Projects";
import NotFound from "./pages/NotFound/NotFound";
import AppLayout from "./components/layout/Layout";
import Analysis from "./pages/Analysis/Analysis";
import ProtectedRoute from "/src/components/auth/ProtectedRoute";
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
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<MyProjects />} />
              <Route path="analysis" element={<Analysis />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterAndLogout />} />
          <Route path="*" element={<NotFound />}></Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
