import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import "/src/styles/Form.css";
import { login } from "/src/services/authService";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "/src/config/constants";
import { Button, TextField, Box } from '@mui/material';
import { useAuth } from "/src/context/AuthContext";
import Alert from '@mui/material/Alert';
import LoadingIndicator from "/src/components/ui/LoadingIndicator";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { setIsAuthenticated } = useAuth();
    const navigate = useNavigate();

    const name = "Login";

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        try {
            const res = await login({ username, password });
            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
                setIsAuthenticated(true);
            }
            navigate("/")
        } catch (error) {
            console.log(error);
            alert(error);
        } finally {
            setLoading(false)
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-container">
            <h1>{name}</h1>
            <TextField
                label="Username"
                variant="outlined"
                className="form-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                sx = {{marginBottom: 2}}
            />
            <TextField
                label="Password"
                variant="outlined"
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                sx = {{marginBottom: 2}}
            />
            <Button variant="contained" color="primary" type="submit" className="form-button">
                {name}
            </Button>
            <div className="form-footer">
                <p>
                    Don't have an account?{" "}
                    <Link to="/register" className="navigate-link">
                        Sign up
                    </Link>
                </p>
            </div>
            {loading && <LoadingIndicator />}
        </form>
    );
}

export default Login;