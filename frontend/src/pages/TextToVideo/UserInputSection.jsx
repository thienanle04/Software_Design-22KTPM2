import React, { useState } from "react";
import { Button, Input, Flex, message } from "antd";

const { TextArea } = Input;

function UserInputSection({ prompt, onPromptChange, onGenerate, loading }) {
  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerate(); // Call the passed onGenerate function
    } else {
      message.open({
        type: "error",
        content: "Please enter a prompt to generate a video.",
        duration: 2,
      });
    }
  };

  return (
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
        <Button
          type="primary"
          style={{
            borderRadius: "8px",
            fontSize: "18px",
            background: "#A56EFF",
          }}
          onClick={handleGenerate}
          loading={loading}
        >
          Generate
        </Button>
      </Flex>
  );
}

export default UserInputSection;