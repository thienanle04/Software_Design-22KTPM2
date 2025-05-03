import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Typography,
  Flex,
  Space,
  Divider,
  Image,
  message,
  Spin,
} from "antd";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "/src/config/constants";

const { Text, Paragraph } = Typography;

const ImageDetails = ({ video, visible, onClose, onPromptSelect }) => {
  const isUserVideo = video?.id && !video.id.toString().startsWith("insp_");
  const [images, setImages] = useState([]);
  const [imageLoading, setImageLoading] = useState(false);

  // Fetch images when modal is visible and for user videos
  useEffect(() => {
    if (visible && isUserVideo && video?.image_ids?.length > 0) {
      const fetchImages = async () => {
        setImageLoading(true);
        try {
          const token = localStorage.getItem(ACCESS_TOKEN);
          if (!token) {
            message.error("Authentication token missing.");
            return;
          }

          const imageData = [];
          for (const imageId of video.image_ids) {
            console.log("Fetching image ID:", imageId);
            const response = await fetch(`http://127.0.0.1:8000/api/image-video/image/${imageId}/`, {
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
            if (response.status === 401) {
              const refresh = localStorage.getItem(REFRESH_TOKEN);
              if (!refresh) throw new Error("No refresh token available.");
              const refreshResponse = await fetch("http://127.0.0.1:8000/api/auth/refresh/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh }),
              });
              const refreshData = await refreshResponse.json();
              if (!refreshResponse.ok) throw new Error("Token refresh failed.");
              localStorage.setItem(ACCESS_TOKEN, refreshData.access);
              const retryResponse = await fetch(`http://127.0.0.1:8000/api/image-video/image/${imageId}/`, {
                headers: {
                  "Authorization": `Bearer ${refreshData.access}`,
                  "Content-Type": "application/json",
                },
              });
              if (!retryResponse.ok) throw new Error("Failed to fetch image.");
              const data = await retryResponse.json();
              imageData.push(data);
            } else if (!response.ok) {
              throw new Error("Failed to fetch image.");
            } else {
              const data = await response.json();
              imageData.push(data);
            }
          }
          setImages(imageData.sort((a, b) => a.order - b.order));
        } catch (error) {
          console.error("Error fetching images:", error);
          message.error("Failed to load images: " + error.message);
        } finally {
          setImageLoading(false);
        }
      };
      fetchImages();
    } else {
      setImages([]);
    }
  }, [visible, video?.image_ids, isUserVideo]);

  const handlePromptClick = () => {
    onPromptSelect(video.prompt);
    onClose();
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width="100%"
      style={{
        top: "5vh",
      }}
      closable={false}
      styles={{
        content: {
          height: "90vh",
          background: "#fff",
          borderRadius: "10px",
          padding: "16px",
        },
      }}
    >
      <Flex
        style={{ height: "100%", width: "100%" }}
        gap={16}
        wrap="wrap"
      >
        {/* Left Panel (Images) */}
        <div
          style={{
            flex: 2,
            borderRadius: "10px",
            minWidth: "400px",
            background: "#f9f9f9",
            maxHeight: "calc(90vh - 32px)",
            overflow: "hidden",
          }}
          justify="center"
          align="center"
        >
          {imageLoading ? (
            <Flex justify="center" align="center" style={{ height: "100%" }}>
              <Spin size="large" />
            </Flex>
          ) : images.length > 0 ? (
            <div
              style={{
                height: "100%",
                overflowY: "auto",
                padding: "16px",
              }}
            >
              {images.map((img) => (
                <Image
                  key={img.id}
                  src={img.image_base64}
                  alt={`Image ${img.order}`}
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: "8px",
                    border: "1px solid #e8e8e8",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    marginBottom: "16px",
                    cursor: "pointer",
                  }}
                  preview={{
                    mask: <div style={{ background: "rgba(0, 0, 0, 0.5)", color: "#fff" }}>View</div>,
                  }}
                />
              ))}
            </div>
          ) : (
            <Text type="secondary" style={{ display: "block", textAlign: "center", padding: "16px" }}>
              No images available for this video.
            </Text>
          )}
        </div>

        {/* Right Panel (Prompt) */}
        <div
          style={{
            flex: 1,
            padding: "16px",
            maxHeight: "calc(90vh - 32px)",
            overflow: "hidden",
          }}
        >
          <Flex justify="end">
            <Button type="text" onClick={onClose}>
              Close
            </Button>
          </Flex>
          <Divider />
          <div
            style={{
              height: "100%",
              overflowY: "auto",
            }}
          >
            <Space style={{ width: "100%" }} direction="vertical">
              <Text strong>Prompt</Text>
              <Paragraph
                style={{
                  backgroundColor: "#f0f0f0",
                  padding: 8,
                  borderRadius: 4,
                  cursor: "pointer",
                }}
                onClick={handlePromptClick}
              >
                {video?.prompt || "No prompt available"}
              </Paragraph>
            </Space>
          </div>
          <Space style={{ width: "100%" }} direction="vertical">
            <Text strong>Use</Text>
            <Button
              style={{ width: "100%" }}
              onClick={handlePromptClick}
            >
              Prompt
            </Button>
          </Space>
        </div>
      </Flex>
    </Modal>
  );
};

export default ImageDetails;