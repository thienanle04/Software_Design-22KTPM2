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
} from "@ant-design/icons";

const { Text, Paragraph } = Typography;

const VideoDetails = ({ video, visible, onClose, onRegenerate, onSave, onDelete, onPromptSelect, loading }) => {
  const isUserVideo = video?.id && !video.id.toString().startsWith("insp_"); // Check if it's a user video (not inspiration)

  const handleMenuClick = ({ key }) => {
    if (key === "download") {
      onSave(video.url);
    } else if (key === "delete" && isUserVideo) {
      onDelete(video.id);
    }
  };

  const items = [
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

  // const handleRecreate = () => {
  //   onRegenerate(selectedPrompt, selectedImage, sound);
  //   onClose();
  // };

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
              height: "100%",
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
          <div>
            <Dropdown
              placement="bottomRight"
              menu={{
                items,
                onClick: handleMenuClick,
              }}
            >
              <Button
                type="text"
                icon={
                  <>
                    <img
                      src="/src/assets/settings-icon.svg"
                      alt="Settings Icon"
                      style={{ width: 16, height: 16 }}
                    />
                  </>
                }
              />
            </Dropdown>
          </div>
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
                onClick={() => onPromptSelect(video.prompt)}
              >
                {video?.prompt || "No prompt available"}
              </Paragraph>

              {/* <Text strong>Image</Text>
              <img
                src={selectedImage || video.image}
                alt="Selected"
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 4,
                }}
              /> */}
            </Space>
          </div>
          <Space style={{ width: "100%" }} direction="vertical">
            <Text strong>Enhancements</Text>
            <Button icon={<UploadOutlined />}>Add Sound</Button>

            <Text strong>Use</Text>
            <Flex justify="space-between" gap={8}>
              <Button
                style={{ flex: 1 }}
                onClick={() => onPromptSelect(video.prompt)}
              >
                Prompt
              </Button>
              <Button
                style={{ flex: 1 }}
                onClick={() => setSelectedImage(video.image)}
              >
                Image
              </Button>
            </Flex>

            {isUserVideo && (
              <Button
                type="primary"
                onClick={onRegenerate}
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
  );
};

export default VideoDetails;