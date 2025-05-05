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
  storyLoading,
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
              disabled={storyLoading}
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
          <div
            className="scroll-container"
          >
            <div
              style={{
                display: "flex",
                gap: "16px",
                flexWrap: "nowrap",
              }}
            >
              {generatedImages.map((img, index) =>
                img ? (
                  <div
                    key={index}
                    style={{
                      flex: "0 0 auto",
                      width: "calc(25% - 12px)", // Adjusts for 4 per row max
                      minWidth: "200px",
                    }}
                  >
                    <Image
                      src={`data:image/png;base64,${img}`}
                      alt={`Generated image ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: "8px",
                        border: "1px solid #e8e8e8",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                      }}
                      preview={{
                        mask: <div style={{ background: "rgba(0, 0, 0, 0.5)", color: "#fff" }}>View</div>,
                      }}
                    />
                  </div>
                ) : null
              )}
            </div>
          </div>
        </Flex>

      ) : null}

     {/* Prompt TextArea with story loading overlay */}
     <div style={{ position: "relative", width: "100%" }}>
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
            paddingRight: "40px",
          }}
          autoSize={{ minRows: 3, maxRows: 7 }}
          disabled={storyLoading}
        />
        {storyLoading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255, 255, 255, 0.6)",
              borderRadius: "8px",
              zIndex: 1,
            }}
          >
            <Spin tip="Generating story..." />
          </div>
        )}
      </div>

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
            disabled={storyLoading}
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
            disabled={storyLoading}
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
          disabled={storyLoading}
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
        
        /* Scroll container styles */
        .scroll-container {
          width: 100%;
          overflow-x: auto;
          padding: 8px 0;
          white-space: nowrap;
        }
        
        /* Webkit scrollbar styles */
        .scroll-container::-webkit-scrollbar {
          height: 6px;
        }
        .scroll-container::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 3px;
        }
        .scroll-container::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.08);
          border-radius: 3px;
        }
        .scroll-container::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.12);
        }
        .scroll-container::-webkit-scrollbar-thumb:active {
          background-color: rgba(0, 0, 0, 0.18);
        }
        
        /* Firefox scrollbar styles */
        .scroll-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
        }
      `}</style>
    </Flex>
  );
}

export default UserInputSection;
