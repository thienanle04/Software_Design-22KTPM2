import React, { useState, useEffect } from "react";
import { Button, Flex, Empty, message } from "antd";
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

  useEffect(() => {
    if (location.state && location.state.prompt) {
      setPrompt(location.state.prompt);
    }
  }, [location.state]);

  const closeModal = () => {
    setModalVisible(false);
    setSelectedVideo(null);
  };

  const handleRegenerate = (newPrompt, newImage, audio) => {
    // Handle the generation logic (this can be used to update the video, regenerate, etc.)
    console.log("Regenerate video with", newPrompt, newImage, audio);
    closeModal();
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
          onRegenerate={handleRegenerate}
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
