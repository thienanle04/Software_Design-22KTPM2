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
  message,
  Spin,
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
  const [loading, setLoading] = useState(false); // Loading state for API call
  const [generatedVideo, setGeneratedVideo] = useState(null); // Generated video data

  useEffect(() => {
    if (location.state && location.state.prompt) {
      setPrompt(location.state.prompt);
    }
  }, [location.state]);

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

 // Handle video save/download
 const handleSaveVideo = () => {
  if (!generatedVideo) return;
  const link = document.createElement("a");
  link.href = generatedVideo;
  link.download = "generated_video.mp4";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  message.success("Video download started!");
};

// // Handle video generation
// const handleGenerate = async () => {
//   if (!prompt.trim()) {
//     message.error("Please enter a prompt.");
//     return;
//   }

//   setLoading(true);
//   try {
//     const response = await fetch("http://127.0.0.1:8000/api/image-video/generate-video-from-text/", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ prompt }),
//     });

//     const data = await response.json();
//     if (response.ok && data.video_base64) {
//       setGeneratedVideo(`data:video/mp4;base64,${data.video_base64}`);
//     } else {
//       message.error(data.error || "Video generation failed.");
//     }
//   } catch (error) {
//     console.error("Video generation error:", error);
//     message.error("Failed to generate video.");
//   }
//   setLoading(false);
// };


// Convert base64 to File object
const base64ToFile = (base64String, filename) => {
  const byteString = atob(base64String);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([arrayBuffer], { type: "image/png" });
  return new File([blob], filename, { type: "image/png" });
};

// Handle video generation by calling two APIs
const handleGenerate = async () => {
  console.log("handleGenerate called with prompt:", prompt);
  if (!prompt.trim()) {
    message.error("Please enter a prompt.");
    return;
  }

  setLoading(true);

  try {
    // Step 1: Generate images from the prompt
    const imageResponse = await fetch("http://127.0.0.1:8000/api/image-video/generate-images/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        story: prompt,
        style: "realistic",
        resolution: "1024x1024",
        aspect_ratio: "16:9",
      }),
    });

    const imageData = await imageResponse.json();
    if (!imageResponse.ok || !imageData.images_data || imageData.images_data.length < 2) {
      throw new Error(imageData.error || "Failed to generate enough images (minimum 2 required).");
    }

    // Convert base64 images to File objects
    const imageFiles = imageData.images_data
      .filter(img => img) // Filter out nulls
      .map((base64, index) => base64ToFile(base64, `image_${index}.png`));

    if (imageFiles.length < 2) {
      throw new Error("Not enough valid images generated.");
    }

    // Step 2: Create video from generated images
    const formData = new FormData();
    imageFiles.forEach(file => formData.append("images", file));
    formData.append("fps", 24);
    formData.append("duration", 2.0); // Adjust as needed for total duration
    formData.append("transition_duration", 1.0);

    const videoResponse = await fetch("http://127.0.0.1:8000/api/image-video/create-video-from-images/", {
      method: "POST",
      body: formData,
    });

    const videoData = await videoResponse.json();
    if (videoResponse.ok && videoData.video_base64) {
      setGeneratedVideo(`data:video/mp4;base64,${videoData.video_base64}`);
      message.success("Video generated successfully!");
    } else {
      throw new Error(videoData.error || "Video generation failed.");
    }
  } catch (error) {
    console.error("Error during generation:", error);
    message.error(error.message || "Failed to generate video.");
  } finally {
    setLoading(false);
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
        {loading ? (
          <Spin tip="Generating video..." />
        ) : generatedVideo ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: 24,
            }}
          >
            <video
              src={generatedVideo}
              controls
              style={{
                maxWidth: "100%",
                width: "600px",
                borderRadius: "8px",
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
              }}
            />
            <Button
              type="default"
              style={{ marginTop: 12 }}
              onClick={handleSaveVideo}
            >
              Save Video
            </Button>
          </div>
        ) : (
          <Empty description="No videos yet" />
        )}

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
          onClick={() => handleGenerate()}
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
