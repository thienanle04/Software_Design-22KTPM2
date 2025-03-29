import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Input, Typography, Divider, notification } from "antd";
import { useAuth } from "/src/context/AuthContext";

const { Title, Paragraph } = Typography;

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const { login } = useAuth();
  const navigate = useNavigate();

  const openNotification = () => {
    api['success']({
      message: "Login Successful",
      description:
        "You have successfully logged in to your account.",
      showProgress: true,
      pauseOnHover: false,
    });
  };

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();

    try {
      const data = await login({ username, password });
      openNotification();
      navigate("/dashboard");
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