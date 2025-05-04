import React, { useRef, useEffect, useState } from "react";
import { Button, Input, Flex, Image, Spin, message, Select } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Option } = Select;

function UserInputSection({
  prompt,
  onPromptChange,
  onGenerate,
  onRefresh,
  loading,
  imageLoading,
  generatedImages,
  style,
  setStyle,
  resolution,
  setResolution,
}) {
  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerate();
    } else {
      message.open({
        type: "error",
        content: "Please enter a prompt to generate content.",
        duration: 2,
      });
    }
  };

  const styleOptions = ["Realistic", "Cartoon", "Abstract", "Painting"];
  const resolutionOptions = ["512x512", "1024x1024", "1280x720"];

  const scrollRef = useRef(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  useEffect(() => {
    const slider = scrollRef.current;
    if (!slider) return;
  
    const handleMouseDown = (e) => {
      setIsDown(true);
      setStartX(e.pageX - slider.offsetLeft);
      setScrollLeft(slider.scrollLeft);
    };
  
    const handleMouseLeave = () => setIsDown(false);
    const handleMouseUp = () => setIsDown(false);
  
    const handleMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2; // drag speed multiplier
      slider.scrollLeft = scrollLeft - walk;
    };
  
    slider.addEventListener("mousedown", handleMouseDown);
    slider.addEventListener("mouseleave", handleMouseLeave);
    slider.addEventListener("mouseup", handleMouseUp);
    slider.addEventListener("mousemove", handleMouseMove);
  
    return () => {
      slider.removeEventListener("mousedown", handleMouseDown);
      slider.removeEventListener("mouseleave", handleMouseLeave);
      slider.removeEventListener("mouseup", handleMouseUp);
      slider.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isDown, startX, scrollLeft]);
  
  return (
    <Flex
      vertical
      align="end"
      gap="small"
      style={{
        width: "70%",
        maxWidth: "1100px",
        position: "sticky",
        bottom: "40px",
        padding: "16px",
        borderRadius: "10px",
        justifySelf: "center",
        background: "#fff",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
      }}
    >
      {imageLoading ? (
        <Flex justify="center" align="center" style={{ width: "100%", height: "150px" }}>
          <Spin size="large" />
        </Flex>
      ) : generatedImages.length > 0 ? (
        <Flex vertical gap="small" style={{ width: "100%" }}>
          <Flex justify="flex-end">
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              style={{
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#A56EFF",
                color: "#fff",
              }}
            />
          </Flex>
          <Flex
            gap={16}
            ref={scrollRef}
            style={{
              width: "100%",
              minWidth: "1008px", // 4 * 240px + 3 * 16px gap
              overflowX: "auto",
              padding: "8px 0",
              whiteSpace: "nowrap",
              cursor: isDown ? "grabbing" : "grab",
              userSelect: "none",
            }}
            className="hide-scrollbar"
          >
            {generatedImages.map((img, index) =>
              img ? (
                <Image
                  key={index}
                  src={`data:image/png;base64,${img}`}
                  alt={`Generated image ${index + 1}`}
                  style={{
                    width: "240px",
                    height: "auto",
                    borderRadius: "8px",
                    border: "1px solid #e8e8e8",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    display: "inline-block",
                  }}
                  preview={{
                    mask: <div style={{ background: "rgba(0, 0, 0, 0.5)", color: "#fff" }}>View</div>,
                  }}
                />
              ) : null
            )}
          </Flex>
        </Flex>
      ) : null}

      <TextArea
        value={prompt}
        onChange={onPromptChange}
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

      <Flex justify="space-between" align="center" style={{ width: "100%" }}>
        <Flex gap="middle">
          <Select
            value={style}
            onChange={setStyle}
            style={{
              width: "140px",
              borderRadius: "16px",
            }}
            className="button-select"
            placeholder="Select Style"
          >
            {styleOptions.map((opt) => (
              <Option key={opt} value={opt}>
                {opt}
              </Option>
            ))}
          </Select>
          <Select
            value={resolution}
            onChange={setResolution}
            style={{
              width: "140px",
              borderRadius: "16px",
            }}
            className="button-select"
            placeholder="Select Resolution"
          >
            {resolutionOptions.map((opt) => (
              <Option key={opt} value={opt}>
                {opt}
              </Option>
            ))}
          </Select>
        </Flex>

        <Button
          type="primary"
          style={{
            borderRadius: "8px",
            fontSize: "18px",
            background: "#A56EFF",
          }}
          onClick={handleGenerate}
          loading={loading || imageLoading}
        >
          {generatedImages.length > 0 ? "Generate Video" : "Generate Images"}
        </Button>
      </Flex>

      <style>{`
        .button-select .ant-select-selector {
          border: 2px solid #A56EFF !important;
          border-radius: 16px !important;
          background: #fff !important;
          height: 36px !important;
          display: flex;
          align-items: center;
        }
        .button-select .ant-select-selection-item {
          color: #333 !important;
          font-size: 14px !important;
        }
        .button-select .ant-select-arrow {
          color: #A56EFF !important;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>
    </Flex>
  );
}

export default UserInputSection;
