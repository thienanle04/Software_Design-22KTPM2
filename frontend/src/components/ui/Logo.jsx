import React from "react";
import { Typography } from "antd";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

function Logo() {
  const navigate = useNavigate();
  return (
    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#fff", cursor: "pointer", padding: "20px 0", textAlign: "center" }} onClick={() => navigate("/dashboard")}>
      <Title level={2} style={{ color: "#26f", margin: 0 }}>
        VisoAI
      </Title>
    </div>
  );
}

export default Logo;