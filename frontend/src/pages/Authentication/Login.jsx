import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Modal, Button, Input, Typography, Divider, message } from "antd";
import { useAuth } from "/src/context/AuthContext";

const { Title, Paragraph } = Typography;

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const notification = location.state?.notification || null;
  if (notification) {
    messageApi.success(notification, 2.5); // Show success message for 2.5 seconds
  }

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();

    try {
      await login({ username, password });
      navigate("/dashboard", { state: { notification: "Login successful!" } });
    } catch (error) {
      console.log(error);
      alert(error);
    } finally {
      setLoading(false);
    }
  };

  const onClose = () => {
    navigate("/dashboard"); // Close the modal and navigate back to dashboard or other route
  };

  return (
    <>
      {contextHolder}
      <Modal open={true} onCancel={onClose} footer={[]}>
        <Title level={4}>Welcome to VisoAI</Title>

        <Divider style={{ borderColor: 'grey' }}>Or</Divider>

        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          style={{ marginBottom: 8 }}
        />
        <Input.Password
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{ marginBottom: 8 }}
        />

        <Button block type="primary" onClick={handleSubmit}>
          Login
        </Button>

        <div style={{ justifySelf: "center" }}>
          <p>
            Don't have an account? <a href="/dashboard/register">Sign up</a>
          </p>
        </div>
      </Modal>
    </>
  );
}

export default Login;
