import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "/src/context/AuthContext";

function ProtectedRoute({ children }) {
    const { IsAuthenticated } = useAuth();

    if (IsAuthenticated === null) {
        return <div>Loading...</div>;
    }

    return IsAuthenticated ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;
