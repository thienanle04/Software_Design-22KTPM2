import React from 'react';
import { Row, Col, Button, Card } from 'antd'; // Import necessary components
import PropTypes from 'prop-types'; // For PropTypes validation

// Example style for the video container
const videoContainerStyle = {
  width: '100%',
  cursor: 'pointer',
  overflow: 'hidden',
  borderRadius: '4px',
  backgroundColor: '#e0e0e0', // Placeholder background
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.3s ease', // Add hover effect transition
  // height based on the resolution of the video
  height: 'auto', // Adjust height based on content
};

const videoStyle = {
  top: 0,
  left: 0,
  width: '100%',
  height: 'auto',
  objectFit: 'cover', // Ensures the video fills the container
  display: 'block',
};

// Hover effect for the video container
const hoverEffectStyle = {
  '&:hover': {
    transform: 'scale(1.05)', // Slight zoom effect on hover
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', // Enhance shadow on hover
  },
};

/**
 * VideoList Component: Displays a list of videos in a responsive grid layout.
 *
 * @param {object[]} videos - Array of video objects. Each object should have at least 'id' and 'url' fields.
 * Example: [{ id: 1, url: '...', prompt: '...', script: '...', sourceImages: [...] }]
 * @param {function} onVideoClick - Callback function triggered when a video is clicked. Receives the video object as an argument.
 */

function VideoList({ videos = [], onVideoClick }) {
  return (
    <Row gutter={[8, 8]} style={{ padding: '0 16px', width: '100%' }}>
      {videos.map((video) => (
        <Col key={video.id} xs={24} sm={12} md={8} lg={8} xl={8}>
          <div
            style={{
              ...videoContainerStyle,
              ...hoverEffectStyle, // Add hover effect styles
            }}
            onClick={() => onVideoClick(video)} // Callback for video click
          >
            <video
              style={videoStyle}
              src={video.url}
              autoPlay
              muted
              loop
              playsInline
            />
          </div>
        </Col>
      ))}
    </Row>
  );
}

// PropTypes validation for video list
VideoList.propTypes = {
  videos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      url: PropTypes.string.isRequired,
      prompt: PropTypes.string.isRequired,
      script: PropTypes.string,
    })
  ).isRequired,
  onVideoClick: PropTypes.func.isRequired,
};

export default VideoList;
