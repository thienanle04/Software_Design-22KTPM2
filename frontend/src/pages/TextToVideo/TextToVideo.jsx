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
import VideoList from "./VideoList";
import StickyHeader from "./StickyHeader";
import UserInputSection from "./UserInputSection";
import VideoDetails from "./VideoDetails";

function EmptyDisplay() {
  return (
    <Empty
      description={
        <span style={{ fontSize: "16px", color: "#000" }}>No videos yet.</span>
      }
      style={{ marginTop: "20px" }}
    />
  );
}

const myVideos = [
  {
    id: 1,
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    prompt: "A beautiful sunset over the mountains",
    script: "A beautiful sunset over the mountains",
  },
  {
    id: 2,
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    prompt: "A serene beach with waves crashing",
    script: "A serene beach with waves crashing",
  },
  {
    id: 3,
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    prompt: "A bustling city street at night",
    script: "A bustling city street at night",
  },
  {
    id: 4,
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    prompt: "A tranquil forest with birds chirping",
    script: "A tranquil forest with birds chirping",
  },
  {
    id: 5,
    // other video url
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4" ,
    prompt: "A vibrant city skyline at dusk",
    script: "A vibrant city skyline at dusk",
  },
  {
    id: 6,
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    prompt: "A snowy mountain peak under a clear sky",
    script: "A snowy mountain peak under a clear sky",
  },
  {
    id: 7,
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" ,
    prompt: "A colorful garden filled with blooming flowers",
    script: "A colorful garden filled with blooming flowers",
  },
  {
    id: 8,
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    prompt: "A peaceful lake surrounded by trees",
    script: "A peaceful lake surrounded by trees",
  }
];
const inspirations = [
  {
    id: 1,
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
    prompt: "A beautiful sunset over the mountains",
    script: "A beautiful sunset over the mountains",
  },
  {
    id: 2,
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
    prompt: "A serene beach with waves crashing",
    script: "A serene beach with waves crashing",
  },
];

const TextToVideo = () => {
  const [selectedVideo, setSelectedVideo] = useState(null); // State to hold the selected video
  const [modalVisible, setModalVisible] = useState(false); // State to control the visibility of the modal
  const [prompt, setPrompt] = useState("");
  const [tab, setTab] = useState("My Creations");
  const [mycreationList, setVideoList] = useState(myVideos);
  const [inspirationList, setInspirationList] = useState(inspirations);
  const [messageApi, contextHolder] = message.useMessage(); // Message API for notifications
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // Loading state for API call
  const [generatedVideo, setGeneratedVideo] = useState(null); // Generated video data

  useEffect(() => {
    if (location.state && location.state.prompt) {
      setPrompt(location.state.prompt);
    }
  }, [location.state]);

  const closeModal = () => {
    setModalVisible(false);
    setSelectedVideo(null);
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
      {contextHolder}

      <StickyHeader tab={tab} setTab={setTab} />

      <Flex
        vertical="column"
        align="center"
        gap="small"
        style={{
          borderRadius: "10px",
          minHeight: "calc(100vh - 200px)",
          width: "100%",
        }}
      >
        {tab === "My Creations" ? (
          myVideos.length === 0 ? (
            <EmptyDisplay />
          ) : (
            <VideoList
              videos={mycreationList}
              onVideoClick={(video) => {
                setSelectedVideo(video);
                setModalVisible(true);
              }}
            />
          )
        ) : inspirations.length === 0 ? (
          <EmptyDisplay />
        ) : (
          <VideoList
            videos={inspirationList}
            onVideoClick={(video) => {
              setSelectedVideo(video);
              setModalVisible(true);
            }}
          />
        )}
      </Flex>

      {/* Video Generation Controls Section */}
      <UserInputSection
        prompt={prompt}
        onPromptChange={(e) => setPrompt(e.target.value)}
      />

      {selectedVideo && (
        <VideoDetails
          video={selectedVideo}
          visible={modalVisible}
          onClose={closeModal}
          onRegenerate={handleGenerate}
        />
      )}

      {/* Custom Scrollbar Styles */}
      <style>{`
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
