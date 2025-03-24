import React, { createContext, useContext, useState, useEffect } from 'react';
import { authenticate } from "/src/services/authService";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [IsAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    authenticate(setIsAuthenticated).catch(() => setIsAuthenticated(false));
  }, []);

  return (
    <AuthContext.Provider value={{ IsAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
