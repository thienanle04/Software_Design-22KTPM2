import React, { useState, useEffect } from "react";
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
  Select,
  InputNumber
} from "antd";
import { UploadOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

function ImageToVideo() {
  const [fileList, setFileList] = useState([]);
  const [videoFileList, setVideoFileList] = useState([]);
  const navigate = useNavigate();

  const [mode, setMode] = useState("Upload Image");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState("Realistic");
  const [resolution, setResolution] = useState("1024x1024");
  const [aspect_ratio, setAspectRatio] = useState("1:1");
  const [generatedImage, setGeneratedImage] = useState(null); // Store the generated image
  const [generatedImages, setGeneratedImages] = useState([]); // Store the generated multiple images
  const [story, setStory] = useState("");
  const [generatedVideo, setGeneratedVideo] = useState(null);

  const [fps, setFps] = useState(24);
  const [duration, setDuration] = useState(2);



  const styles = ["realistic", "cartoon", "modern"];
  const resolutions = ["512x512", "1024x1024", "1920x1080"];
  const aspectRatios = ["1:1", "16:9", "4:3", "9:16", "21:9"];

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
  const handleVideoFileChange = ({ fileList }) => setVideoFileList(fileList);

  // Handle video save
  const handleSaveVideo = () => {
    if (!generatedVideo) return;

    const link = document.createElement("a");
    link.href = generatedVideo;
    link.download = "generated_video.mp4"; // Default filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success("Video download started!");
  };

  // Handle image save
  const handleSaveImage = (imageData, index = null) => {
    if (!imageData) return;
    const link = document.createElement("a");
    link.href = imageData;
    link.download = index !== null ? `generated_image_${index + 1}.png` : "generated_image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success("Image download started!");
  };

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
        body: JSON.stringify({ prompt, style, resolution, aspect_ratio }),
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

  const handleGenerateImages = async () => {
    if (!story) {
      message.error("Please enter a story.");
      return;
    }

    setLoading(true);
    setGeneratedImages([]);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/image-video/generate-images/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          story,
          style,
          resolution,
          aspect_ratio: aspect_ratio
        }),
      });

      const data = await response.json();

      if (response.ok && data.images_data) {
        setGeneratedImages(data.images_data.map(img => `data:image/png;base64,${img}`));
      } else {
        message.error(data.error || "Image generation failed.");
      }
    } catch (error) {
      console.error("Error generating images:", error);
      message.error("Failed to connect to the API.");
    }

    setLoading(false);
  };

  const handleGenerateVideoFromImages = async () => {
    if (videoFileList.length < 2) {
      message.error("Please upload at least 2 images for video creation");
      return;
    }

    setLoading(true);
    const formData = new FormData();

    videoFileList.forEach(file => {
      formData.append("images", file.originFileObj);
    });
    formData.append("fps", fps.toString());
    formData.append("duration", duration.toString());

    try {
      const response = await fetch("http://127.0.0.1:8000/api/image-video/create-video-from-images/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.video_base64) {
        setGeneratedVideo(`data:video/mp4;base64,${data.video_base64}`);
      } else {
        message.error(data.error || "Video creation failed");
      }
    } catch (error) {
      console.error("Video creation error:", error);
      message.error("Failed to create video");
    } finally {
      setLoading(false);
    }
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
            options={["Upload Image", "Generate Image", "Generate Multiple Images"]}
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

              <Select
                style={{ width: "100%", marginBottom: 8 }}
                value={style}
                onChange={(value) => setStyle(value)}
              >
                {styles.map((style) => (
                  <Select.Option key={style} value={style}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </Select.Option>
                ))}
              </Select>

              <Select
                style={{ width: "100%", marginBottom: 8 }}
                value={resolution}
                onChange={(value) => setResolution(value)}
              >
                {resolutions.map((res) => (
                  <Select.Option key={res} value={res}>
                    {res}
                  </Select.Option>
                ))}
              </Select>

              <Select
                style={{ width: "100%", marginBottom: 8 }}
                value={aspect_ratio}
                onChange={(value) => setAspectRatio(value)}
              >
                {aspectRatios.map((ratio) => (
                  <Select.Option key={ratio} value={ratio}>
                    {ratio}
                  </Select.Option>
                ))}
              </Select>

              <Button
                type="primary"
                style={{ background: "#8e44ff", marginBottom: 16 }}
                onClick={handleGenerateImage}
                loading={loading}
              >
                Generate Image
              </Button>

              {generatedImage && (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginTop: 24,
                }}>

                  <img
                    src={generatedImage}
                    alt="Generated"
                    style={{
                      maxWidth: "100%",
                      borderRadius: "8px",
                      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
                    }}
                  />

                  <Button
                    type="default"
                    style={{ marginTop: 8 }}
                    onClick={() => handleSaveImage(generatedImage)}
                  >
                    Save Image
                  </Button>
                </div>
              )}
            </>
          ) : mode === "Generate Multiple Images" ? (
            <>
              <TextArea
                placeholder={`Enter your story with paragraphs separated by new lines\n\nExample:\nA young female traveler in a hooded cloak...\n\nAn ancient stone archway...\n\nA towering Guardian...`}
                autoSize={{ minRows: 6, maxRows: 10 }}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                style={{ background: "#f5f5f5", marginBottom: 8 }}
              />

              <Select
                style={{ width: "100%", marginBottom: 8 }}
                value={style}
                onChange={setStyle}
              >
                {styles.map((style) => (
                  <Select.Option key={style} value={style}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </Select.Option>
                ))}
              </Select>

              <Select
                style={{ width: "100%", marginBottom: 8 }}
                value={resolution}
                onChange={setResolution}
              >
                {resolutions.map((res) => (
                  <Select.Option key={res} value={res}>
                    {res}
                  </Select.Option>
                ))}
              </Select>

              <Select
                style={{ width: "100%", marginBottom: 8 }}
                value={aspect_ratio}
                onChange={setAspectRatio}
              >
                {aspectRatios.map((ratio) => (
                  <Select.Option key={ratio} value={ratio}>
                    {ratio}
                  </Select.Option>
                ))}
              </Select>

              <Button
                type="primary"
                style={{ background: "#8e44ff", marginBottom: 16 }}
                onClick={handleGenerateImages}
                loading={loading}
              >
                Generate Images
              </Button>

              {generatedImages.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  {generatedImages.map((image, index) => (
                    <div style={{
                      border: "1px solid #f0f0f0",
                      borderRadius: 8,
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}>
                      <img
                        src={image}
                        alt={`Generated ${index + 1}`}
                        style={{
                          width: "100%",
                          borderRadius: 4,
                          marginBottom: 8,
                        }}
                      />
                      <Button
                        onClick={() => handleSaveImage(image, index)}
                        style={{ width: "20%" }}
                      >
                        Save Image {index + 1}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <Upload.Dragger
                name="file"
                multiple={false} // Single file upload
                action="#" // Provide your file upload URL or action here
                listType="picture-card"
                fileList={videoFileList}
                beforeUpload={handleUpload}
                onChange={handleVideoFileChange}
                onRemove={() => setFileList([])}
                showUploadList={{ showRemoveIcon: true, showPreviewIcon: false }}
              >
                <div>
                  <UploadOutlined style={{ fontSize: 24, color: "#8c8c8c" }} />
                  <p className="ant-upload-text">Drag your images here</p>
                  <p className="ant-upload-hint">or click to upload</p>
                </div>
              </Upload.Dragger>

              <div style={{ margin: '16px 0' }}>
                <label>Frames per second (FPS): </label>
                <InputNumber
                  min={1}
                  max={60}
                  value={fps}
                  onChange={setFps}
                />

                <label style={{ marginLeft: 16 }}>Seconds per image: </label>
                <InputNumber
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={duration}
                  onChange={setDuration}
                />
              </div>

              <Button
                type="primary"
                style={{ background: "#8e44ff", marginBottom: 16 }}
                loading={loading}
                onClick={handleGenerateVideoFromImages}
                disabled={videoFileList.length < 2}
              >
                Generate Video from Images
              </Button>
              {/* <Button
              type="primary"
              style={{ background: "#8e44ff", marginBottom: 16 }}
              loading={loading}
              onClick={async () => {
                  if (fileList.length === 0) {
                    message.error("Please upload an image.");
                    return;
                  }


                  setLoading(true);
                  const formData = new FormData();
                  formData.append("image", fileList[0].originFileObj);

                  try {
                    const response = await fetch("http://127.0.0.1:8000/api/image-video/generate-video/", {
                      method: "POST",
                      body: formData,
                    });

                    const data = await response.json();
                    if (response.ok && data.video_base64) {
                      setGeneratedVideo(`data:video/mp4;base64,${data.video_base64}`);
                    } else {
                      message.error(data.error || "Video generation failed.");
                    }
                  } catch (error) {
                    console.error("Video generation error:", error);
                    message.error("Failed to generate video.");
                  }

                  setLoading(false);
              }}
            >
              Generate Video
            </Button> */}

              {generatedVideo && (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginTop: 24,
                }}>
                  <video
                    src={generatedVideo}
                    controls
                    style={{
                      maxWidth: "100%",
                      borderRadius: "8px",
                      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
                    }}
                  />

                  <Button
                    type="default"
                    style={{ marginTop: 8 }}
                    onClick={handleSaveVideo}
                  >
                    Save Video
                  </Button>
                </div>
              )}

            </>

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
