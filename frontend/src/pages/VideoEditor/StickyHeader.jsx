import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Typography, Divider } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Flex } from "antd";

const { Text } = Typography;

function StickyHeader({ title = "Video Editor" }) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        position: "sticky",
        top: "0",
        zIndex: 1,
        background: "#ebebec",
        padding: "16px",
        paddingBottom: "16px",
      }}
    >
      <Flex
        align="center"
        gap="0"
        style={{
          width: "fit-content",
          padding: "8px",
          borderRadius: "10px",
          background: "#fff",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/dashboard")}
        />
        <Divider type="vertical" />
        <Text strong={true} style={{ fontSize: "20px", color: "#000" }}>
          {title}
        </Text>
      </Flex>
    </div>
  );
}

export default StickyHeader;