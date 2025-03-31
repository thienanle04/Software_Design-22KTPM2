import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Modal,
  Button,
  Input,
  Segmented,
  Typography,
  Divider,
  Upload,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

function ImageToVideo() {
  const [fileList, setFileList] = useState([]);
  const navigate = useNavigate();

  const [mode, setMode] = useState("Upload Image");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null); // Store the generated image


  const onClose = () => {
    // Close the popup and go back to /dashboard
    navigate("/dashboard");
  };

  // Handle file upload
  const handleUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("You can only upload image files!");
      return false;
    }
    return true;
  };

  // Handle file changes
  const handleChange = ({ fileList }) => setFileList(fileList);

  // Handle image generation request
  const handleGenerateImage = async () => {
    if (!prompt) {
      message.error("Please enter a prompt.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/image-video/generate-image/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (response.ok && data.image_data) {
        setGeneratedImage(`data:image/png;base64,${data.image_data}`);
      } else {
        message.error(data.error || "Image generation failed.");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      message.error("Failed to connect to the API.");
    }

    setLoading(false);
  };

  return (
    <>
      <Modal
        title="Image to Video"
        open={true}
        onCancel={onClose}
        footer={[
          <Button key="continue" type="primary" style={{ background: "#000" }}>
            Continue
          </Button>,
        ]}
        width={800}
      >
        <Divider />

        <div style={{ padding: "0 12px" }}>
          <Title level={4}>Transform Images into Dynamic Videos</Title>
          <Paragraph>
            Upload any image and let AI bring it to life through seamless video
            generation.
          </Paragraph>

          <Segmented
            options={["Upload Image", "Generate Image"]}
            value={mode}
            onChange={setMode}
            style={{ marginBottom: 16 }}
          />

          {mode === "Generate Image" ? (
            <>
              <TextArea
                placeholder="Try something like 'A cat flying in the sky wearing a Superman suit'"
                autoSize={{ minRows: 3, maxRows: 5 }}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                style={{ background: "#f5f5f5", marginBottom: 8 }}
              />
              <Button
                type="primary"
                style={{ background: "#8e44ff", marginBottom: 16 }}
                onClick={handleGenerateImage}
                loading={loading}
              >
                Generate
              </Button>

              {generatedImage && (
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <img
                    src={generatedImage}
                    alt="Generated"
                    style={{
                      maxWidth: "100%",
                      borderRadius: "8px",
                      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <Upload.Dragger
              name="file"
              multiple={false} // Single file upload
              action="#" // Provide your file upload URL or action here
              listType="picture-card"
              fileList={fileList}
              beforeUpload={handleUpload}
              onChange={handleChange}
              onRemove={() => setFileList([])}
              showUploadList={{ showRemoveIcon: true, showPreviewIcon: false }}
            >
              <div>
                <UploadOutlined style={{ fontSize: 24, color: "#8c8c8c" }} />
                <p className="ant-upload-text">Drag your images here</p>
                <p className="ant-upload-hint">or click to upload</p>
              </div>
            </Upload.Dragger>
          )}
          <Divider>OR</Divider>

          <Paragraph strong style={{ marginBottom: 8 }}>
            No picture on hand? Try with one of these
          </Paragraph>
          {/* Add image thumbnails or suggestions here */}
        </div>
      </Modal>
    </>
  );
}

export default ImageToVideo;
