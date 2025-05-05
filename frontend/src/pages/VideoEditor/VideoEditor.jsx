import React, { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import StickyHeader from './StickyHeader';

const VideoEditor = () => {
    const [videoFile, setVideoFile] = useState(null);
    const [audioFile, setAudioFile] = useState(null);
    const [outputUrl, setOutputUrl] = useState(null);
    const [progress, setProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const ffmpegRef = useRef(null);
    const videoRef = useRef(null);
    const audioRef = useRef(null);
    const previewVideoRef = useRef(null);
    const previewAudioRef = useRef(null);

    // Timeline states
    const [videoDuration, setVideoDuration] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [videoStart, setVideoStart] = useState(0);
    const [videoEnd, setVideoEnd] = useState(0);
    const [audioStart, setAudioStart] = useState(0);
    const [audioEnd, setAudioEnd] = useState(0);

    // Preview states
    const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);

    // Initialize FFmpeg
    useEffect(() => {
        const loadFFmpeg = async () => {
            try {
                const coreURL = await toBlobURL(
                    'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js',
                    'text/javascript'
                );
                const wasmURL = await toBlobURL(
                    'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm',
                    'application/wasm'
                );

                const ffmpeg = new FFmpeg({
                    corePath: coreURL,
                    wasmPath: wasmURL,
                    log: true,
                });

                await ffmpeg.load();
                ffmpeg.on('progress', ({ progress: p }) => {
                    setProgress(Math.round(p * 100));
                });

                ffmpegRef.current = ffmpeg;
                console.log('FFmpeg loaded successfully');
            } catch (err) {
                console.error('Failed to load FFmpeg:', err);
                setError('Failed to initialize video editor. Please refresh the page or try again later.');
            }
        };

        loadFFmpeg();

        return () => {
            if (outputUrl) URL.revokeObjectURL(outputUrl);
            if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
            if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        };
    }, [outputUrl, videoPreviewUrl, audioPreviewUrl]);

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setVideoFile(file);
        setError(null);

        // Create preview URL
        const url = URL.createObjectURL(file);
        setVideoPreviewUrl(url);

        const video = document.createElement('video');
        video.src = url;

        video.onloadedmetadata = () => {
            setVideoDuration(video.duration);
            setVideoEnd(video.duration);
        };
    };

    const handleAudioChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setAudioFile(file);
        setError(null);

        // Create preview URL
        const url = URL.createObjectURL(file);
        setAudioPreviewUrl(url);

        const audio = new Audio(url);

        audio.onloadedmetadata = () => {
            setAudioDuration(audio.duration);
            setAudioEnd(audio.duration);
        };
    };

    const toggleVideoPlayback = () => {
        if (previewVideoRef.current) {
            if (isVideoPlaying) {
                previewVideoRef.current.pause();
            } else {
                previewVideoRef.current.currentTime = videoStart;
                previewVideoRef.current.play();
            }
            setIsVideoPlaying(!isVideoPlaying);
        }
    };

    const toggleAudioPlayback = () => {
        if (previewAudioRef.current) {
            if (isAudioPlaying) {
                previewAudioRef.current.pause();
            } else {
                previewAudioRef.current.currentTime = audioStart;
                previewAudioRef.current.play();
            }
            setIsAudioPlaying(!isAudioPlaying);
        }
    };

    // Handle when video reaches the end of the selected segment
    useEffect(() => {
        const video = previewVideoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            if (video.currentTime >= videoEnd) {
                video.pause();
                setIsVideoPlaying(false);
            }
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }, [videoEnd]);

    // Handle when audio reaches the end of the selected segment
    useEffect(() => {
        const audio = previewAudioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            if (audio.currentTime >= audioEnd) {
                audio.pause();
                setIsAudioPlaying(false);
            }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
    }, [audioEnd]);

    const mergeVideoAudio = async () => {
        if (!videoFile || !audioFile) {
            setError('Please select both video and audio files');
            return;
        }

        try {
            setIsProcessing(true);
            setError(null);
            setOutputUrl(null);
            setProgress(0);

            const ffmpeg = ffmpegRef.current;

            await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
            await ffmpeg.writeFile('audio.mp3', await fetchFile(audioFile));

            // Calculate durations
            const videoDuration = videoEnd - videoStart;
            const audioDuration = audioEnd - audioStart;
            const finalDuration = Math.min(videoDuration, audioDuration);

            // Build FFmpeg command with trimming
            const command = [
                '-i', 'input.mp4',
                '-i', 'audio.mp3',
                // Trim video
                '-ss', videoStart.toString(),
                '-t', finalDuration.toString(),
                // Trim audio
                '-filter_complex', `[1:a]atrim=start=${audioStart}:end=${audioEnd},asetpts=PTS-STARTPTS[a]`,
                // Map streams
                '-map', '0:v:0',
                '-map', '[a]',
                '-c:v', 'copy',
                '-c:a', 'aac',
                '-shortest',
                'output.mp4'
            ];

            await ffmpeg.exec(command);

            const data = await ffmpeg.readFile('output.mp4');
            const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
            setOutputUrl(url);
        } catch (err) {
            console.error('Merge error:', err);
            setError(`Error: ${err.message}. Please try different files or adjust the timeline.`);
        } finally {
            setIsProcessing(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div>
            {/* StickyHeader ở đây */}
            <StickyHeader title="Video Editor" />

            {/* Container chính - thêm padding top để tránh bị header che */}
            <div style={{ ...styles.container, paddingTop: '120px' }}>
                {error && <div style={styles.error}>{error}</div>}

                <div style={styles.inputGroup}>
                    <div style={styles.inputContainer}>
                        <label style={styles.label}>Select Video:</label>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoChange}
                            disabled={isProcessing}
                            style={styles.input}
                        />
                        {videoPreviewUrl && (
                            <div style={styles.previewContainer}>
                                <video
                                    ref={previewVideoRef}
                                    src={videoPreviewUrl}
                                    controls={false}
                                    style={styles.previewVideo}
                                    onClick={toggleVideoPlayback}
                                />
                                <div style={styles.previewControls}>
                                    <button
                                        onClick={toggleVideoPlayback}
                                        style={styles.playButton}
                                    >
                                        {isVideoPlaying ? 'Pause' : 'Play'}
                                    </button>
                                    <span style={styles.previewTime}>
                                        {formatTime(videoStart)} - {formatTime(videoEnd)}
                                    </span>
                                </div>
                                <div style={styles.timelineContainer}>
                                    <div style={styles.timelineHeader}>
                                        <span>Start: {formatTime(videoStart)}</span>
                                        <span style={styles.durationText}>Duration: {formatTime(videoEnd - videoStart)}</span>
                                        <span>End: {formatTime(videoEnd)}</span>
                                    </div>
                                    <div style={styles.timelineControls}>
                                        <input
                                            type="range"
                                            min="0"
                                            max={videoDuration}
                                            step="0.1"
                                            value={videoStart}
                                            onChange={(e) => setVideoStart(parseFloat(e.target.value))}
                                            style={styles.timelineInput}
                                        />
                                        <input
                                            type="range"
                                            min="0"
                                            max={videoDuration}
                                            step="0.1"
                                            value={videoEnd}
                                            onChange={(e) => setVideoEnd(parseFloat(e.target.value))}
                                            style={styles.timelineInput}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={styles.inputContainer}>
                        <label style={styles.label}>Select Audio:</label>
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={handleAudioChange}
                            disabled={isProcessing}
                            style={styles.input}
                        />
                        {audioPreviewUrl && (
                            <div style={styles.previewContainer}>
                                <div style={styles.audioWaveform}>
                                    <span style={styles.audioLabel}>Audio Track</span>
                                </div>
                                <div style={styles.previewControls}>
                                    <button
                                        onClick={toggleAudioPlayback}
                                        style={styles.playButton}
                                    >
                                        {isAudioPlaying ? 'Pause' : 'Play'}
                                    </button>
                                    <span style={styles.previewTime}>
                                        {formatTime(audioStart)} - {formatTime(audioEnd)}
                                    </span>
                                </div>
                                <audio
                                    ref={previewAudioRef}
                                    src={audioPreviewUrl}
                                    onEnded={() => setIsAudioPlaying(false)}
                                />
                                <div style={styles.timelineContainer}>
                                    <div style={styles.timelineHeader}>
                                        <span>Start: {formatTime(audioStart)}</span>
                                        <span style={styles.durationText}>Duration: {formatTime(audioEnd - audioStart)}</span>
                                        <span>End: {formatTime(audioEnd)}</span>
                                    </div>
                                    <div style={styles.timelineControls}>
                                        <input
                                            type="range"
                                            min="0"
                                            max={audioDuration}
                                            step="0.1"
                                            value={audioStart}
                                            onChange={(e) => setAudioStart(parseFloat(e.target.value))}
                                            style={styles.timelineInput}
                                        />
                                        <input
                                            type="range"
                                            min="0"
                                            max={audioDuration}
                                            step="0.1"
                                            value={audioEnd}
                                            onChange={(e) => setAudioEnd(parseFloat(e.target.value))}
                                            style={styles.timelineInput}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    style={{
                        ...styles.button,
                        ...(isProcessing || !videoFile || !audioFile ? styles.buttonDisabled : {}),
                    }}
                    onClick={mergeVideoAudio}
                    disabled={isProcessing || !videoFile || !audioFile}
                >
                    {isProcessing ? `Processing... ${progress}%` : 'Merge Video & Audio'}
                </button>

                {outputUrl && (
                    <div style={styles.resultContainer}>
                        <h3 style={styles.subHeader}>Result:</h3>
                        <video ref={videoRef} src={outputUrl} controls style={styles.video} />
                        <a href={outputUrl} download="merged_video.mp4" style={styles.downloadButton}>
                            Download Result
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        paddingTop: '120px',
    },
    header: {
        color: '#333',
        textAlign: 'center',
    },
    error: {
        color: '#ff4444',
        backgroundColor: '#ffeeee',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '15px',
    },
    inputGroup: {
        display: 'flex',
        gap: '20px',
        marginBottom: '20px',
        flexWrap: 'wrap',
    },
    inputContainer: {
        flex: '1',
        minWidth: '250px',
    },
    label: {
        display: 'block',
        marginBottom: '5px',
        fontWeight: 'bold',
    },
    input: {
        width: '100%',
        padding: '8px',
        marginBottom: '10px',
    },
    button: {
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        fontSize: '16px',
        cursor: 'pointer',
        borderRadius: '4px',
        transition: 'background-color 0.3s',
        width: '100%',
    },
    buttonDisabled: {
        backgroundColor: '#cccccc',
        cursor: 'not-allowed',
    },
    resultContainer: {
        marginTop: '30px',
        borderTop: '1px solid #eee',
        paddingTop: '20px',
    },
    subHeader: {
        color: '#333',
    },
    video: {
        width: '100%',
        maxHeight: '500px',
        backgroundColor: '#000',
        margin: '15px 0',
    },
    downloadButton: {
        display: 'inline-block',
        backgroundColor: '#2196F3',
        color: 'white',
        padding: '10px 15px',
        textDecoration: 'none',
        borderRadius: '4px',
        transition: 'background-color 0.3s',
    },
    timelineContainer: {
        marginTop: '10px',
        padding: '10px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
    },
    timelineHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '10px',
        alignItems: 'center',
    },
    durationText: {
        fontWeight: 'bold',
        color: '#333',
    },
    timelineControls: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    timelineInput: {
        width: '100%',
    },
    previewContainer: {
        marginTop: '10px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '10px',
    },
    previewVideo: {
        width: '100%',
        maxHeight: '200px',
        backgroundColor: '#000',
        cursor: 'pointer',
    },
    audioWaveform: {
        height: '60px',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
        marginBottom: '10px',
    },
    audioLabel: {
        color: '#666',
    },
    previewControls: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '10px',
    },
    playButton: {
        backgroundColor: '#2196F3',
        color: 'white',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    previewTime: {
        color: '#666',
        fontSize: '0.9em',
    },
};

export default VideoEditor;