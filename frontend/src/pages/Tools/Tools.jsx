import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ImageToVideo from "/src/pages/ImageToVideo/ImageToVideo";

const toolComponentMap = {
  "image-to-video": ImageToVideo,
//   "text-to-image": TextToImage,
//   "text-to-video": TextToVideo,
};

function Tools() {
  const location = useLocation();
  const navigate = useNavigate();

  // Check the query parameter
  const params = new URLSearchParams(location.search);
  const tool = params.get("tool");

  const ToolComponent = toolComponentMap[tool];

  useEffect(() => {
    if (tool && !toolComponentMap[tool]) {
      navigate("/dashboard");
    }
  }, [tool]);

  return (
    <>
      {ToolComponent ? <ToolComponent /> : <div style={{ padding: 24 }}>Please select a tool.</div>}
    </>
  );

}

export default Tools;
