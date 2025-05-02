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

  
  const openNotification = (message) => {
    messageApi.open({
      type: "success",
      content: message,
    });
  };

  const notification = location.state?.notification || null;
  if (notification) {
    messageApi.success(notification, 2.5);
  }

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();

    try {
      const data = await login({ username, password });
      openNotification();
      navigate("/dashboard", { state: { notification: "Login successful!" } });
    } catch (error) {
      console.error("Login error:", error);
      messageApi.error(error.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const onClose = () => {
    navigate("/dashboard");
  };

  return (
    <>
      {contextHolder}
      <Modal open={true} onCancel={onClose} footer={[]}>
        <Title level={4}>Login</Title>
        <Paragraph>
          Please enter your credentials to login to your account.
        </Paragraph>

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
        />

        <Divider />
        <Button block type="primary" onClick={handleSubmit} loading={loading}>
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