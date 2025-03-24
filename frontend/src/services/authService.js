import api from "/src/config/api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "/src/config/constants";
import { jwtDecode } from "jwt-decode";

const refreshToken = async (setIsAuthenticated) => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    try {
        const res = await api.post("/api/auth/refresh/", {
            refresh: refreshToken,
        });
        if (res.status === 200) {
            localStorage.setItem(ACCESS_TOKEN, res.data.access)
            setIsAuthenticated(true)
        } else {
            setIsAuthenticated(false)
        }
    } catch (error) {
        console.log(error);
        setIsAuthenticated(false);
    }
};

export const authenticate = async (setIsAuthenticated) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const decoded = jwtDecode(token);
    const tokenExpiration = decoded.exp;
    const now = Date.now() / 1000;

    if (tokenExpiration < now) {
        console.log("Token expired");
        await refreshToken(setIsAuthenticated);
    } else {
        console.log("Token is valid");
        setIsAuthenticated(true);
    }
};

export const login = async ({ username, password }) => {
    try {
        const res = await api.post("/api/auth/login/", {
            username,
            password,
        });
        return res;
    } catch (error) {
        throw error;
    }
}

export const register = async ({ username, password }) => {
    try {
        const res = await api.post("/api/auth/register/", {
            username,
            password,
        });
        return res;
    } catch (error) {
        throw error;
    }
}

export const logout = async (setIsAuthenticated) => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    setIsAuthenticated(false);
    return;
}