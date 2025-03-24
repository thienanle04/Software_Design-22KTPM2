import CircularProgress from '@mui/material/CircularProgress';
import "/src/styles/LoadingIndicator.css";

const LoadingIndicator = () => {
  return <div className="loader-container">
      <CircularProgress />
    </div>;
};

export default LoadingIndicator;
