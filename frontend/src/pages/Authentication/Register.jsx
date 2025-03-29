import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Input, Typography, Divider } from "antd";
import { useAuth } from "/src/context/AuthContext";

const { Title, Paragraph } = Typography;

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();

    try {
      const data = await register({ username, password });
      navigate("/login");
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
    <Modal
      open={true}
      onCancel={onClose}
      footer={[
      ]}
    >
      <Title level={4}>Register</Title>
      <Paragraph>
        Create a new account by entering your details below.
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
        Register
      </Button>

      <div style={{ justifySelf: "center" }}>
        <p>
          Already have an account? <a href="/dashboard/login">Login</a>
        </p>
      </div>
    </Modal>
  );
}

export default Register;
