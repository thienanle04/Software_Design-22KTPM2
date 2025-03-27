import React from "react";
import { Typography } from "antd";

const { Title } = Typography;

function Logo() {
  return (
    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#fff", cursor: "pointer", padding: "5px 0", textAlign: "center" }}>
      <Title level={2} style={{ color: "#26f", margin: 0 }}>
        VisoAI
      </Title>
    </div>
  );
}

export default Logo;