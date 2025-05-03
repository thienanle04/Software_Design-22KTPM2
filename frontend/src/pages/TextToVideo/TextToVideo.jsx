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
import { useAuth } from "../../context/AuthContext";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "/src/config/constants";

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

const inspirations = [
  {
    id: "insp_1",
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    prompt: "A beautiful sunset over the mountains",
    script: "A beautiful sunset over the mountains",
    images: [], // No images for inspiration videos
  },
  {
    id: "insp_2",
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    prompt: "A serene beach with waves crashing",
    script: "A serene beach with waves crashing",
    images: [],
  },
  {
    id: "insp_3",
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    prompt: "A bustling city street at night",
    script: "A bustling city street at night",
    images: [],
  },
  {
    id: "insp_4",
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    prompt: "A tranquil forest with birds chirping",
    script: "A tranquil forest with birds chirping",
    images: [],
  },
  {
    id: "insp_5",
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
    prompt: "A vibrant city skyline at dusk",
    script: "A vibrant city skyline at dusk",
    images: [],
  },
  {
    id: "insp_6",
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    prompt: "A snowy mountain peak under a clear sky",
    script: "A snowy mountain peak under a clear sky",
    images: [],
  },
  {
    id: "insp_7",
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    prompt: "A colorful garden filled with blooming flowers",
    script: "A colorful garden filled with blooming flowers",
    images: [],
  },
  {
    id: "insp_8",
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    prompt: "A peaceful lake surrounded by trees",
    script: "A peaceful lake surrounded by trees",
    images: [],
  },
  {
    id: "insp_9",
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
    prompt: "A beautiful sunset over the mountains",
    script: "A beautiful sunset over the mountains",
    images: [],
  },
];

const TextToVideo = () => {
  const { authLoading } = useAuth();
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [tab, setTab] = useState("My Creations");
  const [mycreationList, setVideoList] = useState([]);
  const [inspirationList, setInspirationList] = useState(inspirations);
  const [messageApi, contextHolder] = message.useMessage();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);

  // Refresh token on 401 error
  const refreshToken = async () => {
    const refresh = localStorage.getItem(REFRESH_TOKEN);
    if (!refresh) throw new Error("No refresh token available.");
    const response = await fetch("http://127.0.0.1:8000/api/auth/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem(ACCESS_TOKEN, data.access);
      return data.access;
    }
    throw new Error("Token refresh failed.");
  };

  // Fetch user's saved videos
  useEffect(() => {
    const fetchUserVideos = async () => {
      try {
        let token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
          messageApi.error("Authentication token missing. Please log in again.");
          return;
        }
        let response = await fetch("http://127.0.0.1:8000/api/image-video/user-videos/", {
          
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
        if (response.status === 401) {
          token = await refreshToken();
          response = await fetch("http://127.0.0.1:8000/api/image-video/user-videos/", {
            
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          });
        }
        if (response.ok) {
          const videos = await response.json();
          setVideoList(
            videos.map((video) => ({
              id: video.id,
              url: `data:video/mp4;base64,${video.video_base64}`,
              prompt: video.prompt,
              script: video.prompt,
              image_ids: video.image_ids || []
            }))
          );
        } else {
          messageApi.error("Failed to fetch videos.");
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
        messageApi.error("Error fetching videos: " + error.message);
      }
    };
    if (!authLoading) {
      fetchUserVideos();
    }
  }, [authLoading, messageApi]);

  // Fetch selected video data
  useEffect(() => {
    if (selectedVideoId && !selectedVideoId.toString().startsWith("insp_")) {
      const fetchVideoData = async () => {
        try {
          let token = localStorage.getItem(ACCESS_TOKEN);
          if (!token) {
            messageApi.error("Authentication token missing.");
            return;
          }
          const response = await fetch(`http://127.0.0.1:8000/api/image-video/video/${selectedVideoId}/`, {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          if (response.status === 401) {
            token = await refreshToken();
            const retryResponse = await fetch(`http://127.0.0.1:8000/api/image-video/video/${selectedVideoId}/`, {
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
            if (!retryResponse.ok) throw new Error("Failed to fetch video data.");
            const data = await retryResponse.json();
            setVideoData({
              id: data.id,
              url: `data:video/mp4;base64,${data.video_base64}`,
              prompt: data.prompt,
              script: data.prompt,
              image_ids: data.images.map(img => img.id),
            });
          } else if (!response.ok) {
            throw new Error("Failed to fetch video data.");
          } else {
            const data = await response.json();
            setVideoData({
              id: data.id,
              url: `data:video/mp4;base64,${data.video_base64}`,
              prompt: data.prompt,
              script: data.prompt,
              image_ids: data.images.map(img => img.id),
            });
          }
        } catch (error) {
          console.error("Error fetching video data:", error);
          messageApi.error("Failed to load video data: " + error.message);
        }
      };
      fetchVideoData();
    } else if (selectedVideoId && selectedVideoId.toString().startsWith("insp_")) {
      const inspVideo = inspirationList.find(v => v.id === selectedVideoId);
      setVideoData(inspVideo);
    } else {
      setVideoData(null);
    }
  }, [selectedVideoId, messageApi]);

  // Handle prompt from location state
  useEffect(() => {
    if (location.state && location.state.prompt) {
      setPrompt(location.state.prompt);
    }
  }, [location.state]);

  const closeModal = () => {
    setModalVisible(false);
    setSelectedVideoId(null);
    setVideoData(null);
  };

  // Handle video save/download
  const handleSaveVideo = (videoUrl) => {
    if (!videoUrl) {
      messageApi.error("No video URL available for download.");
      return;
    }
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = "video.mp4";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    messageApi.success("Video download started!");
  };

  // Handle video deletion
  const handleDeleteVideo = async (videoId) => {
    try {
      let token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        messageApi.error("Authentication token missing. Please log in again.");
        return;
      }

      let response = await fetch(`http://127.0.0.1:8000/api/image-video/delete-video/${videoId}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        token = await refreshToken();
        response = await fetch(`http://127.0.0.1:8000/api/image-video/delete-video/${videoId}/`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
      }

      if (response.ok) {
        setVideoList(mycreationList.filter((video) => video.id !== videoId));
        setModalVisible(false);
        setSelectedVideoId(null);
        setVideoData(null);
        messageApi.success("Video deleted successfully!");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete video.");
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      messageApi.error(error.message || "Failed to delete video.");
    }
  };

  // Handle prompt selection from VideoDetails
  const handlePromptSelect = (selectedPrompt) => {
    setPrompt(selectedPrompt);
    closeModal();
  };

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

  // Handle video generation
  const handleGenerate = async () => {
    console.log("handleGenerate called with prompt:", prompt);
    if (!prompt.trim()) {
      messageApi.error("Please enter a prompt.");
      return;
    }

    setLoading(true);

    try {
      let token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        messageApi.error("Authentication token missing. Please log in again.");
        return;
      }

      // Step 1: Generate images from the prompt
      let imageResponse = await fetch("http://127.0.0.1:8000/api/image-video/generate-images/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          story: prompt,
          style: "realistic",
          resolution: "1024x1024",
          aspect_ratio: "16:9",
        }),
      });

      if (imageResponse.status === 401) {
        token = await refreshToken();
        imageResponse = await fetch("http://127.0.0.1:8000/api/image-video/generate-images/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            story: prompt,
            style: "realistic",
            resolution: "1024x1024",
            aspect_ratio: "16:9",
          }),
        });
      }

      const imageData = await imageResponse.json();
      console.log("Image generation response:", imageData);
      if (!imageResponse.ok) {
        throw new Error(imageData.error || "Failed to generate images.");
      }
      if (!imageData.images_data || !Array.isArray(imageData.images_data) || imageData.images_data.length < 2) {
        throw new Error("Invalid or insufficient images returned from server.");
      }

      // Convert base64 images to File objects
      const imageFiles = imageData.images_data
        .filter(img => img)
        .map((base64, index) => base64ToFile(base64, `image_${index}.png`));

      if (imageFiles.length < 2) {
        throw new Error("Not enough valid images generated (minimum 2 required).");
      }

      // Step 2: Create video from generated images
      const formData = new FormData();
      imageFiles.forEach((file) => formData.append("images", file));
      formData.append("fps", 24);
      formData.append("duration", 2.0);
      formData.append("transition_duration", 1.0);
      formData.append("prompt", prompt);

      let videoResponse = await fetch("http://127.0.0.1:8000/api/image-video/create-video-from-images/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (videoResponse.status === 401) {
        token = await refreshToken();
        videoResponse = await fetch("http://127.0.0.1:8000/api/image-video/create-video-from-images/", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
        });
      }

      const videoData = await videoResponse.json();
      if (videoResponse.ok && videoData.video_base64) {
        const newVideo = {
          id: videoData.video_id,
          url: `data:video/mp4;base64,${videoData.video_base64}`,
          prompt: videoData.prompt,
          script: videoData.prompt,
          image_ids: [], // Will be updated on next fetch
        };
        setGeneratedVideo(newVideo.url);
        setVideoList([newVideo, ...mycreationList]);
        messageApi.success("Video generated and saved successfully!");
        closeModal();
      } else {
        throw new Error(videoData.error || "Video generation failed.");
      }
    } catch (error) {
      console.error("Error during generation:", error);
      messageApi.error(error.message || "Failed to generate video.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <Spin size="large" style={{ display: "block", margin: "50px auto" }} />;
  }

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
          mycreationList.length === 0 ? (
            <EmptyDisplay />
          ) : (
            <VideoList
              videos={mycreationList}
              onVideoClick={(video) => {
                setSelectedVideoId(video.id);
                setModalVisible(true);
              }}
            />
          )
        ) : inspirationList.length === 0 ? (
          <EmptyDisplay />
        ) : (
          <VideoList
            videos={inspirationList}
            onVideoClick={(video) => {
              setSelectedVideoId(video.id);
              setModalVisible(true);
            }}
          />
        )}
      </Flex>

      <UserInputSection
        prompt={prompt}
        onPromptChange={(e) => setPrompt(e.target.value)}
        onGenerate={handleGenerate}
        loading={loading}
      />

      {videoData && (
        <VideoDetails
          video={videoData}
          visible={modalVisible}
          onClose={closeModal}
          onRegenerate={handleGenerate}
          onSave={handleSaveVideo}
          onDelete={handleDeleteVideo}
          onPromptSelect={handlePromptSelect}
          loading={loading}
        />
      )}

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
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
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