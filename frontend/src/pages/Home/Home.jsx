import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Typography, Flex } from "antd";
import { FaDice } from "react-icons/fa";

const { Title, Paragraph } = Typography;

function GenerateButtonIcon() {
  return (
    <svg
      className="size-4"
      width="17" // Set the width of the SVG icon
      height="16" // Set the height of the SVG icon
      fill="none"
      viewBox="0 0 17 16"
    >
      <path
        fill="currentColor"
        d="M6.154 6.513c.429-.096.763-.43.86-.859l.665-2.995c.195-.879 1.447-.879 1.642 0l.666 2.995c.096.429.43.763.858.86l2.996.665c.879.195.879 1.447 0 1.642l-2.995.666c-.429.096-.763.43-.86.858l-.665 2.996c-.195.879-1.447.879-1.642 0l-.666-2.995a1.134 1.134 0 0 0-.859-.86L3.16 8.822c-.879-.195-.879-1.447 0-1.642l2.995-.666Z"
      ></path>
    </svg>
  );
}

function Home() {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  const handleGenerate = () => {
    if (prompt.trim()) {
      navigate("/dashboard/tools/text-to-video", { state: { prompt } });
    } else {

    }
  };

  return (
    <div
      style={{
        padding: "40px 20px",
        background:
          "linear-gradient(to right,rgb(186, 213, 254), rgb(224, 187, 236))",
        borderRadius: "10px",
      }}
    >
      <Title level={2} style={{ justifySelf: "center", padding: "20px" }}>Describe your ideas and generate</Title>
      <Paragraph style={{ fontSize: "18px" }}>
        Transform your words into visual masterpieces: Leverage AI technology to
        craft breathtaking videos.
      </Paragraph>
      <Flex justify="space-between" align="center" gap="small">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Write a prompt to generate"
          prefix={
            <Button
              type="text"
              icon={<FaDice style={{ fontSize: "20px", color: "#6a58b5" }} />}
            />
          }
          style={{
            borderRadius: "8px",
            height: "50px",
            background: "#fff",
            fontSize: "16px",
          }}
        />
        <Button
          type="primary"
          style={{
            height: "50px",
            backgroundColor: "#6a58b5",
            borderRadius: "8px",
            fontSize: "18px",
          }}
          icon={<GenerateButtonIcon />}
          onClick={handleGenerate}
        >
          Generate
        </Button>
      </Flex>
    </div>
  );
}

export default Home;