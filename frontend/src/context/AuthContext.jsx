import React, { createContext, useContext, useState, useEffect } from "react";
import api from "/src/config/api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "/src/config/constants";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    try {
      const res = await api.post("/api/auth/refresh/", {
        refresh: refreshToken,
      });
      if (res.status === 200) {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log(error);
      setIsAuthenticated(false);
    }
  };

  const authenticate = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);

    if (!token) {
      console.log("No token found");
      setIsAuthenticated(false);
      return;
    }

    const decoded = jwtDecode(token);
    const tokenExpiration = decoded.exp;
    const now = Date.now() / 1000;

    if (tokenExpiration < now) {
      console.log("Token expired");
      await refreshToken();
    } else {
      console.log("Token is valid");
      setIsAuthenticated(true);
    }
  };

  const handleResponse = (res, successStatus) => {
    if (res.status === successStatus) {
      return res.data;
    } else {
      throw new Error("Request failed with status: " + res.status);
    }
  };
  
  const setAuthTokens = (accessToken, refreshToken) => {
    localStorage.setItem(ACCESS_TOKEN, accessToken);
    localStorage.setItem(REFRESH_TOKEN, refreshToken);
  };
  
  const login = async ({ username, password }) => {
    try {
      const res = await api.post("/api/auth/login/", { username, password });
      const data = handleResponse(res, 200);  // Checking for 200 OK status
      setAuthTokens(data.access, data.refresh);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw new Error("Login failed. Please check your credentials.");
    }
  };
  
  const register = async ({ username, password }) => {
    try {
      const res = await api.post("/api/auth/register/", { username, password });
      const data = handleResponse(res, 201);  // Checking for 201 Created status
      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw new Error("Registration failed. Please try again.");
    }
  };
  

  const logout = async () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    setIsAuthenticated(false);
    return;
  };

  useEffect(() => {
    authenticate().catch(() => setIsAuthenticated(false)).finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
