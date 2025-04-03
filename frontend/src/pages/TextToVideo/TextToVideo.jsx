import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Tabs,
  Affix,
  Flex,
  Typography,
  Divider,
  Empty,
  Segmented,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

const TextToVideo = () => {
  const [prompt, setPrompt] = useState("");
  const [tab, setTab] = useState("My Creations");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state && location.state.prompt) {
      setPrompt(location.state.prompt);
    }
  }, [location.state]);

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleGenerate = () => {
    if (prompt.trim()) {
      navigate("/dashboard/tools/text-to-video", { state: { prompt } });
    } else {
      // Show error message
    }
  };

  return (
    <div style={{ background: "#ebebec" }}>
      <div
        style={{
          position: "sticky",
          top: "0",
          width: "100%",
          zIndex: 1,
          background: "#ebebec",
        }}
      >
        <div style={{ padding: "16px" }}>
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
              onClick={() => navigate("/dashboard/")}
            />
            <Divider type="vertical" />
            <Text strong={true} style={{ fontSize: "20px", color: "#000" }}>
              Text to Video
            </Text>
            <Divider type="vertical" />
          </Flex>

          {/* Tabs for My Creations and Inspirations */}
          <Flex style={{ width: "100%" }}>
            <Segmented
              size="large"
              options={["My Creations", "Inspirations"]}
              value={tab}
              onChange={setTab}
              style={{
                margin: "30px 0",
                borderRadius: "10px",
                padding: "0px",
                background: "#ebebec",
              }}
            />
          </Flex>
        </div>
      </div>

      <Flex
        vertical="column"
        align="center"
        gap="small"
        style={{
          borderRadius: "10px",
          minHeight: "calc(100vh - 64px - 24px)",
        }}
      >
        <Empty description="No videos yet" />
      </Flex>

      {/* Video Generation Controls Section */}
      <Flex
        vertical="column"
        align="end"
        gap="small"
        style={{
          width: "70%",
          position: "sticky",
          bottom: "40px",
          padding: "16px",
          borderRadius: "10px",
          justifySelf: "center",
          background: "#fff",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
        }}
      >
        <TextArea
          value={prompt}
          onChange={handlePromptChange}
          placeholder="Describe your video..."
          style={{
            borderRadius: "8px",
            height: "50px",
            fontSize: "16px",
            width: "100%",
            border: "0px",
            outline: "2px solid rgb(255, 255, 255)",
          }}
          autoSize={{ minRows: 3, maxRows: 7 }}
        />
        <Button
          type="primary"
          style={{
            borderRadius: "8px",
            fontSize: "18px",
            background: "#A56EFF",
          }}
          onClick={handleGenerate}
        >
          Generate
        </Button>
      </Flex>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        /* Hide the scrollbar */
        /* Custom Scrollbar Styling */
        textarea::-webkit-scrollbar {
          height: 8px;
        }

        textarea::-webkit-scrollbar-button {
          display: none;
        }

        textarea::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        textarea::-webkit-scrollbar-track {
          background-color: transparent;
        }

        textarea {
          scrollbar-width: thin; /* For Firefox */
          scrollbar-color: rgba(0, 0, 0, 0.2) transparent; /* For Firefox */
          border: none;
          outline: none;
        }

        textarea:focus {
          border: none;
          outline: "0px solid #fff"
        }
      `}</style>
    </div>
  );
};

export default TextToVideo;
