import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ImageToVideo from "/src/pages/ImageToVideo/ImageToVideo";
import URLToVideo from "/src/pages/URLToVideo/URLToVideo";
import VideoEditor from "../VideoEditor/VideoEditor";
const toolComponentMap = {
  "image-to-video": ImageToVideo,
  "url-to-video": URLToVideo,
  "video-editor": VideoEditor,
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