import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "/src/context/AuthContext";

function ProtectedRoute() {
    const { isAuthenticated, loading } = useAuth();

    if (isAuthenticated === null) {
        return <div>Loading...</div>;
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    return isAuthenticated ? <Outlet/> : <Navigate to="/login" />;
}

export default ProtectedRoute;