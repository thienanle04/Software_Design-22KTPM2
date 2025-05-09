import { useState } from "react";
import {
  Modal,
  Button,
  Typography,
  Flex,
  Space,
  Divider,
  Dropdown,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  GoogleOutlined,
  FacebookOutlined,
  TikTokOutlined,
} from "@ant-design/icons";
import ImageDetails from "./ImageDetails";

const { Text, Paragraph } = Typography;

const VideoDetails = ({
  video,
  visible,
  onClose,
  onRegenerate,
  onSave,
  onDelete,
  onPromptSelect,
  loading,
}) => {
  const isUserVideo = video?.id && !video.id.toString().startsWith("insp_"); // Check if it's a user video (not inspiration)
  const [showImageModal, setShowImageModal] = useState(false);
  const [sound, setSound] = useState(null);

  const handleMenuClick = ({ key }) => {
    if (key === "download") {
      onSave(video.url);
    } else if (key === "delete" && isUserVideo) {
      onDelete(video.id);
    }
  };

  const handlePromptClick = () => {
    onPromptSelect(video.prompt);
    onClose(); // Close modal after selecting prompt
  };

  const handleImageClick = () => {
    console.log("Image button clicked, opening ImageDetails modal");
    setShowImageModal(true);
  };

  const handleRecreate = () => {
    onRegenerate(video.prompt);
    onClose(); // Close modal after recreating
  };

  const optionItems = [
    {
      label: "Download",
      key: "download",
      icon: <DownloadOutlined />,
    },
    ...(isUserVideo ? [{
      label: "Delete",
      key: "delete",
      icon: <DeleteOutlined />,
    }] : []),
  ];

  const shareItems = [
    {
      label: "Share with Youtube",
      key: "google",
      icon: <GoogleOutlined />,
    },
    {
      label: "Share with Facebook",
      key: "facebook",
      icon: <FacebookOutlined />,
    },
    {
      label: "Share with TikTok",
      key: "tiktok",
      icon: <TikTokOutlined />,
    },
  ];

  return (
  <>
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
        },
      }}
    >
      <Flex
        style={{ height: "fit-content", width: "100%" }}
        gap={16}
        wrap="wrap"
      >
        {/* Left Panel (Video & Controls) */}
        <div
          style={{
            flex: 3,
            borderRadius: "10px",
            minWidth: "400px",
          }}
          justify="center"
          align="center"
        >
          <video
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "10px",
            }}
            src={video?.url}
            autoPlay
            loop
            playsInline
            muted
            controls
            controlsList="nodownload noplaybackrate nofullscreen"
          />
        </div>

        {/* Right Panel (Settings, Prompt, Image, Sound) */}
        <div
          style={{
            flex: 1,
          }}
        >
          <Flex justify="end">
            <Dropdown
              placement="bottomRight"
              menu={{
                items: shareItems,
                onClick: handleMenuClick,
              }}
              trigger={["click"]}
            >
              <Button type="text" icon={<ShareAltOutlined />} />
            </Dropdown>
            <Dropdown
              placement="bottomRight"
              menu={{
                items: optionItems,
                onClick: handleMenuClick,
              }}
              trigger={["click"]}
            >
              <Button
                type="text"
                icon={
                  <img
                    src="/src/assets/settings-icon.svg"
                    alt="Settings Icon"
                    style={{ width: 16, height: 16 }}
                  />
                }
              />
            </Dropdown>
          </Flex>

          <Divider />

          <div
            style={{
              maxHeight: "calc(100vh - 400px)",
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
            <Text strong>Enhancements</Text>
            <Button icon={<UploadOutlined />}>Add Sound</Button>

            <Text strong>Use</Text>
            <Flex justify="space-between" gap={8}>
              <Button
                style={{ flex: 1 }}
                onClick={handlePromptClick}
              >
                Prompt
              </Button>
              <Button
                style={{ flex: 1 }}
                onClick={handleImageClick}
              >
                Image
              </Button>
            </Flex>
            {isUserVideo && (
              <Button
                type="primary"
                onClick={handleRecreate}
                style={{ width: "100%" }}
                loading={loading}
              >
                Recreate
              </Button>
            )}
          </Space>
        </div>
      </Flex>
    </Modal>
    
    {isUserVideo && (
      <ImageDetails
        video={video}
        visible={showImageModal}
        onClose={() => setShowImageModal(false)}
        onPromptSelect={onPromptSelect}
      />
    )}
  </>
  );
};

export default VideoDetails;