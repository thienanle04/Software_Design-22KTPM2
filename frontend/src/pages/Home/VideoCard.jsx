import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { CardMedia, IconButton, CardHeader, CardActions, Box } from "@mui/material";
import { Edit, Share } from "@mui/icons-material";
import "/src/styles/VideoCard.css";

function VideoCard({ video }) {
  return (
    <Card sx={{ display: "flex", flexDirection: "row", marginBottom: 2 }}>
      <CardMedia
        component="img"
        image={video.thumbnail}
        alt={video.title}
        sx={{ width: "40%" }}
      />
      <Box sx={{ display: "flex", flexDirection: "column", width: "60%" }}>
        <CardHeader title={video.title} />
        <CardContent>{video.description}</CardContent>
      </Box>
      <CardActions sx={{ display: "flex", flexDirection: "column" }}>
        <IconButton size="small">
          <Edit />
        </IconButton>
        <IconButton size="small">
          <Share />
        </IconButton>
      </CardActions>
    </Card>
  );
}

export default VideoCard;
