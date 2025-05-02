import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Typography, Card, Flex, Space } from "antd";
import { RocketOutlined, FileTextOutlined, SoundOutlined, VideoCameraOutlined, CloudUploadOutlined, DatabaseOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <DatabaseOutlined style={{ fontSize: "32px", color: "#6a58b5" }} />,
      title: "Collect Scientific Data",
      description: "Automatically gather and clean data from sources like Wikipedia, Nature, and PubMed to fuel your videos.",
    },
    {
      icon: <FileTextOutlined style={{ fontSize: "32px", color: "#6a58b5" }} />,
      title: "Generate Engaging Scripts",
      description: "Transform complex science into vivid, audience-tailored stories using AI, with options for manual edits.",
    },
    {
      icon: <SoundOutlined style={{ fontSize: "32px", color: "#6a58b5" }} />,
      title: "Synthesize Natural Voices",
      description: "Create customizable AI narration in multiple languages, perfect for kids or professional content.",
    },
    {
      icon: <VideoCameraOutlined style={{ fontSize: "32px", color: "#6a58b5" }} />,
      title: "Produce Stunning Visuals",
      description: "Generate images and videos with AI tools like DALL-E and RunwayML, with manual adjustments for accuracy.",
    },
    {
      icon: <RocketOutlined style={{ fontSize: "32px", color: "#6a58b5" }} />,
      title: "Sync and Enhance Videos",
      description: "Seamlessly combine audio, visuals, and effects, with tools for manual synchronization and polishing.",
    },
    {
      icon: <CloudUploadOutlined style={{ fontSize: "32px", color: "#6a58b5" }} />,
      title: "Publish and Manage",
      description: "Export videos to YouTube, TikTok, and more, with automated metadata and content management.",
    },
  ];

  return (
    <div
      style={{
        padding: "40px 20px",
        background: "linear-gradient(to right, rgb(186, 213, 254), rgb(224, 187, 236))",
        minHeight: "100vh",
        borderRadius: "10px",
      }}
    >
      {/* Hero Section */}
      <Flex
        vertical
        align="center"
        justify="center"
        style={{ textAlign: "center", padding: "40px 20px" }}
      >
        <Title
          level={1}
          style={{
            color: "#333",
            fontWeight: "bold",
            marginBottom: "16px",
          }}
        >
          Welcome to Science Video Creator
        </Title>
        <Paragraph
          style={{
            fontSize: "18px",
            color: "#555",
            maxWidth: "800px",
            marginBottom: "24px",
          }}
        >
          Unleash the power of AI to transform complex scientific concepts into engaging, dynamic videos. Our platform automates the creation of captivating content, making science accessible and exciting for everyone, especially young learners. From data collection to publishing, we’ve got you covered.
        </Paragraph>
        <Button
          type="primary"
          size="large"
          style={{
            backgroundColor: "#6a58b5",
            borderRadius: "8px",
            fontSize: "18px",
            height: "50px",
            padding: "0 32px",
          }}
          onClick={() => navigate("/dashboard")}
        >
          Explore the Dashboard
        </Button>
      </Flex>

      {/* Features Section */}
      <Flex
        vertical
        align="center"
        style={{ padding: "40px 20px" }}
      >
        <Title
          level={2}
          style={{
            color: "#333",
            marginBottom: "32px",
            textAlign: "center",
          }}
        >
          What We Offer
        </Title>
        <Flex
          wrap="wrap"
          justify="center"
          gap="middle"
          style={{ maxWidth: "1200px" }}
        >
          {features.map((feature, index) => (
            <Card
              key={index}
              hoverable
              style={{
                width: "300px",
                borderRadius: "10px",
                margin: "16px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
              }}
              bodyStyle={{ padding: "24px", textAlign: "center" }}
            >
              <Space direction="vertical" size="middle">
                {feature.icon}
                <Title level={4} style={{ color: "#333", margin: 0 }}>
                  {feature.title}
                </Title>
                <Paragraph style={{ color: "#555", fontSize: "14px" }}>
                  {feature.description}
                </Paragraph>
              </Space>
            </Card>
          ))}
        </Flex>
      </Flex>

      {/* Footer Call to Action */}
      <Flex
        justify="center"
        style={{ padding: "40px 20px", textAlign: "center" }}
      >
        <Paragraph
          style={{
            fontSize: "16px",
            color: "#555",
            maxWidth: "600px",
          }}
        >
          Ready to bring science to life? Join us and create stunning videos that inspire curiosity and learning.
        </Paragraph>
      </Flex>
      <Button
        type="primary"
        size="large"
        style={{
          backgroundColor: "#A56EFF",
          borderRadius: "8px",
          fontSize: "18px",
          height: "50px",
          padding: "0 32px",
          display: "block",
          margin: "0 auto",
        }}
        onClick={() => navigate("/dashboard/tools/text-to-video")}
      >
        Start Creating Now
      </Button>
    </div>
  );
};

export default Home;