import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Typography, Flex, message, Upload, Select, Card } from "antd";
import { FaLink, FaPaperclip, FaUserFriends } from "react-icons/fa";

const { Title, Paragraph } = Typography;
const { Option } = Select;

function GenerateButtonIcon() {
  return (
    <svg
      className="size-4"
      width="17"
      height="16"
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

function URLToVideo() {
  const [url, setUrl] = useState("");
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [audience, setAudience] = useState("general");
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const beforeUpload = (file) => {
    const isAllowedType = [
      'text/plain',
      'application/pdf',
      'image/png',
      'image/jpeg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ].includes(file.type);

    if (!isAllowedType) {
      messageApi.error('You can only upload text, PDF, image, or Word files!');
      return false;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      messageApi.error('File must smaller than 5MB!');
      return false;
    }

    return true;
  };

  const handleUploadChange = ({ fileList }) => {
    setFileList(fileList);
  };

  const handleGenerate = async () => {
    if (!url.trim()) {
      messageApi.warning("Please enter a URL");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("url", url);
    formData.append("audience", audience);

    fileList.forEach(file => {
      formData.append("files", file.originFileObj);
    });

    try {
      const response = await fetch("http://127.0.0.1:8000/api/gen_script/simplified-science/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("API Response:", data.simplified_explanation);

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate simplified explanation");
      }

      navigate("/dashboard/tools/text-to-video", {
        state: {
          prompt: data.simplified_explanation
        }
      });

    } catch (error) {
      console.error("API Error:", error);
      messageApi.error(error.message || "Failed to process your request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      style={{
        padding: "24px",
        background: "linear-gradient(to right, rgb(186, 213, 254), rgb(224, 187, 236))",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      }}
    >
      {contextHolder}
      <Title level={2} style={{ textAlign: "center", marginBottom: 8, color: "#2d3748" }}>
        URL to Video
      </Title>
      <Paragraph style={{
        fontSize: "16px",
        textAlign: "center",
        marginBottom: 24,
        color: "#4a5568"
      }}>
        Convert web content into engaging videos
      </Paragraph>

      <div style={{ marginBottom: 24 }}>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          style={{
            borderRadius: "8px",
            height: "50px",
            background: "#fff",
            fontSize: "16px",
            marginBottom: 16,
          }}
          prefix={<FaLink style={{ color: "rgba(0, 0, 0, 0.25)" }} />}
        />

        <Flex gap={16} style={{ marginBottom: 16 }}>
          <Select
            style={{ width: "100%" }}
            value={audience}
            onChange={setAudience}
            placeholder="Select audience"
            optionLabelProp="label"
            suffixIcon={<FaUserFriends />}
          >
            <Option value="children" label="Children">
              <div style={{ display: "flex", alignItems: "center" }}>
                <span role="img" aria-label="children">👶</span>
                <span style={{ marginLeft: 8 }}>Children</span>
              </div>
            </Option>
            <Option value="teenagers" label="Teenagers">
              <div style={{ display: "flex", alignItems: "center" }}>
                <span role="img" aria-label="teenagers">🧒</span>
                <span style={{ marginLeft: 8 }}>Teenagers</span>
              </div>
            </Option>
            <Option value="general" label="General">
              <div style={{ display: "flex", alignItems: "center" }}>
                <span role="img" aria-label="general">👥</span>
                <span style={{ marginLeft: 8 }}>General</span>
              </div>
            </Option>
            <Option value="professionals" label="Professionals">
              <div style={{ display: "flex", alignItems: "center" }}>
                <span role="img" aria-label="professionals">👔</span>
                <span style={{ marginLeft: 8 }}>Professionals</span>
              </div>
            </Option>
            <Option value="academic" label="Academic">
              <div style={{ display: "flex", alignItems: "center" }}>
                <span role="img" aria-label="academic">🎓</span>
                <span style={{ marginLeft: 8 }}>Academic</span>
              </div>
            </Option>
          </Select>
        </Flex>

        <Upload
          multiple
          beforeUpload={beforeUpload}
          onChange={handleUploadChange}
          fileList={fileList}
          showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
          style={{ marginBottom: 16 }}
        >
          <Button icon={<FaPaperclip />} style={{ width: "100%" }}>
            Attach Files (PDF, Word, Images)
          </Button>
        </Upload>
      </div>

      <Button
        type="primary"
        size="large"
        style={{
          height: "50px",
          backgroundColor: "#6a58b5",
          borderRadius: "8px",
          fontSize: "18px",
          width: "100%",
        }}
        icon={<GenerateButtonIcon />}
        onClick={handleGenerate}
        loading={loading}
      >
        Generate Video from URL
      </Button>
    </Card>
  );
}

export default URLToVideo;