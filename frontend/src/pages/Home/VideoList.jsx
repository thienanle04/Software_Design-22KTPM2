import React from "react";
import VideoCard from "./VideoCard";
import { Box, Button } from "@mui/material";
import "/src/styles/VideoList.css";

function VideoList({ videos, emptyHeading }) {
  const count = videos.length;
  let heading = emptyHeading;
  if (count > 0) {
    const noun = count > 1 ? "Videos" : "Video";
    heading = count + " " + noun;
  }

  return (
    <section>
      <Box sx={{ maxWidth: 600, margin: "auto" }}>
        <Box sx={{ height: 50, display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <h2>{heading}</h2>
          <Button variant="contained" color="primary" size="small">
            Add Video
          </Button>
        </Box>
        <div className="scrollable-list">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </Box>
    </section>
  );
}

export default VideoList;
