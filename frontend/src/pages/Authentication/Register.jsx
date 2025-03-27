import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import "/src/styles/Form.css";
import LoadingIndicator from "/src/components/ui/LoadingIndicator";
import { Button, TextField } from '@mui/material';
import { useAuth } from "/src/context/AuthContext";

function Register() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const name = "Register";

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        try {
            const data = await register({ username, password });
            navigate("/login")
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
                    Already have an account?{" "}
                    <Link to="/login" className="navigate-link">
                        Login
                    </Link>
                </p>
            </div>
            {loading && <LoadingIndicator />}
        </form>
    );
}

export default Register;