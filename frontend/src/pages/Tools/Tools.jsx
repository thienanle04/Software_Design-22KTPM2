import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ImageToVideo from "/src/pages/ImageToVideo/ImageToVideo";

const toolComponentMap = {
  "image-to-video": ImageToVideo,
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
      {ToolComponent ? (
        <ToolComponent />
      ) : (
        <></>
      )}
    </>
  );
}

export default Tools;