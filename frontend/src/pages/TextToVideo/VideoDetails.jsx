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

const { Text, Paragraph } = Typography;

const textHolder =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

const optionItems = [
  {
    label: "Download",
    key: "download",
    icon: <DownloadOutlined />,
  },
  {
    label: "Delete",
    key: "delete",
    icon: <DeleteOutlined />,
  },
];

const shareItems = [
  {
    label: "Share with Youtube",
    key: "google",
    icon: <GoogleOutlined/>
  },
  {
    label: "Share with Facebook",
    key: "facebook",
    icon: <FacebookOutlined/>
  },
  {
    label: "Share with TikTok",
    key: "tiktok",
    icon: <TikTokOutlined/>
  }
]

const VideoDetails = ({ video, visible, onClose, onRegenerate }) => {
  const [selectedPrompt, setSelectedPrompt] = useState(video?.prompt || "");
  const [selectedImage, setSelectedImage] = useState(video?.image || "");
  const [sound, setSound] = useState(null);

  const handleRecreate = () => {
    onRegenerate(selectedPrompt, selectedImage, sound);
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
      classNames={{}}
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
          <Flex justify="end">
            <Dropdown
              placement="bottomRight"
              menu={{
                items: shareItems,
              }}
              trigger={['click']}
            >
              <Button type="text" icon={<ShareAltOutlined />} />
            </Dropdown>

            <Dropdown
              menu={{
                items: optionItems,
              }}
              trigger={['click']}
              placement="bottomRight"
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
                }}
              >
                {textHolder}
              </Paragraph>

              <Text strong>Image</Text>
              <img
                src={selectedImage || video.image}
                alt="Selected"
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 4,
                }}
              />
            </Space>
          </div>
          <Space style={{ width: "100%" }} direction="vertical">
            <Text strong>Enhancements</Text>
            <Button icon={<UploadOutlined />}>Add Sound</Button>

            <Text strong>Use</Text>
            <Flex justify="space-between" gap={8}>
              <Button
                style={{ flex: 1 }}
                onClick={() => setSelectedPrompt(video.prompt)}
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

            <Button
              type="primary"
              onClick={handleRecreate}
              style={{ width: "100%" }}
            >
              Recreate
            </Button>
          </Space>
        </div>
      </Flex>
    </Modal>
  );
};

export default VideoDetails;
