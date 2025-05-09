import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Flex, Empty, message } from 'antd';
import StickyHeader from './StickyHeader';
import VideoList from "./VideoList";
import { Range } from 'react-range';
import { useAuth } from "../../context/AuthContext";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "/src/config/constants";

function EmptyDisplay() {
    return (
        <Empty
            description={
                <span style={{ fontSize: "16px", color: "#000" }}>No videos yet.</span>
            }
            style={{ marginTop: "20px" }}
        />
    );
}

const VideoEditor = () => {
    // State management
    const [state, setState] = useState({
        videoFile: null,
        audioFile: null,
        outputUrl: null,
        progress: 0,
        isProcessing: false,
        error: null,
        videoDuration: 0,
        audioDuration: 0,
        videoStart: 0,
        videoEnd: 0,
        audioStart: 0,
        audioEnd: 0,
        videoPreviewUrl: null,
        audioPreviewUrl: null,
        isPlaying: false,
        currentTime: 0,
    });

    const [videoList, setVideoList] = useState([]);
    const [selectedVideoId, setSelectedVideoId] = useState(null);
    const [authLoading, setAuthLoading] = useState(false);

    const ffmpegRef = useRef(null);
    const previewVideoRef = useRef(null);
    const previewAudioRef = useRef(null);
    const previewRef = useRef(null);
    const animationFrameRef = useRef(null);
    const timeoutIdRef = useRef(null);
    const initialAudioDurationRef = useRef(null);
    const initialVideoDurationRef = useRef(null);

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

                ffmpeg.on('progress', ({ progress }) => {
                    setState(prev => ({ ...prev, progress: Math.round(progress * 100) }));
                });

                ffmpegRef.current = ffmpeg;
            } catch (err) {
                setState(prev => ({ ...prev, error: 'Failed to initialize FFmpeg' }));
            }
        };

        loadFFmpeg();

        return () => {
            if (state.outputUrl) URL.revokeObjectURL(state.outputUrl);
            if (state.videoPreviewUrl) URL.revokeObjectURL(state.videoPreviewUrl);
            if (state.audioPreviewUrl) URL.revokeObjectURL(state.audioPreviewUrl);
        };
    }, []);

    const refreshToken = async () => {
        const refresh = localStorage.getItem(REFRESH_TOKEN);
        if (!refresh) throw new Error("No refresh token available.");
        const response = await fetch("http://127.0.0.1:8000/api/auth/refresh/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh }),
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem(ACCESS_TOKEN, data.access);
            return data.access;
        }
        throw new Error("Token refresh failed.");
    };

    const fetchUserVideos = useCallback(async () => {
        try {
            setAuthLoading(true);
            let token = localStorage.getItem(ACCESS_TOKEN);
            if (!token) {
                message.error("Authentication token missing. Please log in again.");
                return;
            }

            const request = async () => {
                const response = await fetch("http://127.0.0.1:8000/api/image-video/user-videos/", {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (response.status === 401) {
                    token = await refreshToken();
                    return await fetch("http://127.0.0.1:8000/api/image-video/user-videos/", {
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                        },
                    });
                }
                return response;
            };

            const response = await request();

            if (response.ok) {
                const videos = await response.json();
                setVideoList(
                    videos.map((video) => ({
                        id: video.id,
                        url: `data:video/mp4;base64,${video.video_base64}`,
                        prompt: video.prompt,
                        script: video.prompt,
                        image_ids: video.image_ids || [],
                    }))
                );
            } else {
                throw new Error("Failed to fetch videos");
            }
        } catch (error) {
            console.error("Error fetching videos:", error);
            message.error("Error fetching videos: " + error.message);
        } finally {
            setAuthLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading) {
            fetchUserVideos();
        }
    }, [authLoading, fetchUserVideos]);

    const handleFileChange = async (type, e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const url = URL.createObjectURL(file);
            const mediaElement = type === 'video'
                ? document.createElement('video')
                : new Audio(url);

            await new Promise((resolve, reject) => {
                mediaElement.onloadedmetadata = () => resolve();
                mediaElement.onerror = () => reject(new Error(`Failed to load ${type} metadata`));
                if (type === 'video') mediaElement.src = url;
            });

            setState(prev => ({
                ...prev,
                [`${type}File`]: file,
                [`${type}PreviewUrl`]: url,
                [`${type}Duration`]: mediaElement.duration,
                [`${type}End`]: mediaElement.duration,
                [`${type}Start`]: 0,
                error: null
            }));

            // Set initial durations for range constraints
            if (type === 'video') {
                initialVideoDurationRef.current = mediaElement.duration;
            } else {
                initialAudioDurationRef.current = mediaElement.duration;
            }
        } catch (err) {
            console.error(`Error loading ${type}:`, err);
            setState(prev => ({ ...prev, error: `Failed to load ${type} file` }));
            message.error(`Failed to load ${type} file`);
        }
    };

    const handleSelectVideo = async (selectedVideo) => {
        if (!selectedVideo || !ffmpegRef.current) return;

        const ffmpeg = ffmpegRef.current;
        const strippedName = `stripped_video_${selectedVideo.id}.mp4`;

        setSelectedVideoId(selectedVideo.id);
        setState(prev => ({
            ...prev,
            isProcessing: true,
            error: null
        }));

        try {
            // Ghi file video vào FFmpeg FS
            await ffmpeg.writeFile('input.mp4', await fetchFile(selectedVideo.url));

            // Tách video không tiếng
            await ffmpeg.exec([
                '-i', 'input.mp4',
                '-an',
                '-c:v', 'copy',
                strippedName
            ]);

            // Đọc video mới
            const strippedData = await ffmpeg.readFile(strippedName);
            const strippedBlob = new Blob([strippedData.buffer], { type: 'video/mp4' });
            const strippedUrl = URL.createObjectURL(strippedBlob);

            // Tạo element video và audio để lấy metadata
            const videoElement = document.createElement('video');
            videoElement.src = strippedUrl;
            videoElement.onloadedmetadata = () => {
                setState(prev => ({
                    ...prev,
                    videoFile: { name: strippedName },
                    videoPreviewUrl: strippedUrl,
                    videoDuration: videoElement.duration,
                    videoStart: 0,
                    videoEnd: videoElement.duration
                }));
                initialVideoDurationRef.current = videoElement.duration;

                setTimeout(() => {
                    previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            };

            const audio = new Audio(selectedVideo.url); // Gốc để dùng âm thanh
            audio.onloadedmetadata = () => {
                const fakeAudioFile = { name: `audio_from_video_${selectedVideo.id}.mp3` };
                setState(prev => ({
                    ...prev,
                    audioFile: fakeAudioFile,
                    audioPreviewUrl: selectedVideo.url,
                    audioDuration: audio.duration,
                    audioStart: 0,
                    audioEnd: audio.duration
                }));
                initialAudioDurationRef.current = audio.duration;
            };

            audio.onerror = () => {
                setState(prev => ({ ...prev, error: 'Failed to load audio from video' }));
            };
        } catch (err) {
            console.error('Error stripping video:', err);
            setState(prev => ({ ...prev, error: 'Failed to process selected video' }));
        } finally {
            setState(prev => ({ ...prev, isProcessing: false }));
        }
    };


    const togglePlayback = useCallback(() => {
        if (!state.videoPreviewUrl) return;

        // Stop playback if currently playing
        if (state.isPlaying) {
            previewVideoRef.current?.pause();
            previewAudioRef.current?.pause();
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
                timeoutIdRef.current = null;
            }
            cancelAnimationFrame(animationFrameRef.current);
            setState(prev => ({ ...prev, isPlaying: false }));
            return;
        }

        // Start playback
        const video = previewVideoRef.current;
        const audio = previewAudioRef.current;

        if (!video) return;

        // Calculate sync points
        const videoStartTime = state.videoStart;
        const audioStartTime = state.audioStart;
        const syncOffset = videoStartTime - audioStartTime;

        // Set video playback
        video.currentTime = 0;
        video.play().catch(err => console.error('Video play error:', err));

        // Handle audio sync
        if (audio && state.audioPreviewUrl) {
            if (syncOffset >= 0) {
                // Video starts after audio
                audio.currentTime = syncOffset;
                audio.play().catch(err => console.error('Audio play error:', err));
            } else {
                // Video starts before audio - delay audio playback
                audio.currentTime = 0;
                timeoutIdRef.current = setTimeout(() => {
                    audio.play().catch(err => console.error('Delayed audio play error:', err));
                }, -syncOffset * 1000);
            }
        }

        // Animation frame for progress tracking
        const startTimestamp = performance.now();
        const updateTime = () => {
            const elapsed = (performance.now() - startTimestamp) / 1000;
            const currentTime = state.videoStart + elapsed;

            setState(prev => ({ ...prev, currentTime }));

            // Stop if reached end of video
            if (currentTime >= state.videoEnd) {
                video.pause();
                if (audio) audio.pause();
                cancelAnimationFrame(animationFrameRef.current);
                setState(prev => ({ ...prev, isPlaying: false, currentTime: state.videoStart }));
            } else {
                animationFrameRef.current = requestAnimationFrame(updateTime);
            }
        };

        animationFrameRef.current = requestAnimationFrame(updateTime);
        setState(prev => ({ ...prev, isPlaying: true }));
    }, [state.isPlaying, state.videoPreviewUrl, state.videoStart, state.audioStart, state.videoEnd, state.audioPreviewUrl]);

    const mergeMedia = async () => {
        if (!ffmpegRef.current || !state.videoFile || !state.audioFile) return;

        try {
            setState(prev => ({ ...prev, isProcessing: true, error: null }));

            const { videoStart, videoEnd, audioStart, audioEnd } = state;
            const ffmpeg = ffmpegRef.current;

            // Load input files
            await Promise.all([
                ffmpeg.writeFile('input.mp4', await fetchFile(state.videoPreviewUrl)),
                ffmpeg.writeFile('audio.mp3', await fetchFile(state.audioPreviewUrl))
            ]);

            const videoDuration = videoEnd - videoStart;
            const audioDuration = audioEnd - audioStart;

            // 1. Process video (trim chính xác)
            await ffmpeg.exec([
                '-i', 'input.mp4',
                '-an',                         // Remove audio
                '-ss', videoStart.toString(),  // Start time
                '-t', videoDuration.toString(), // Exact duration
                '-c:v', 'copy',               // Copy video stream
                'video_processed.mp4'
            ]);

            // 2. Process audio (chính xác hơn)
            const audioDelay = Math.max(0, audioStart - videoStart);
            const audioTrimStart = Math.max(0, videoStart - audioStart);

            // Command xử lý audio mới
            await ffmpeg.exec([
                '-i', 'audio.mp3',
                '-af', `adelay=${audioDelay * 1000}|${audioDelay * 1000}`, // Delay audio
                '-ss', audioTrimStart.toString(),          // Start time
                '-to', audioEnd.toString(),               // End time (thay vì -t)
                'audio_processed.mp3'
            ]);

            // 3. Xử lý khi audio ngắn hơn video (thêm silence)
            if (audioEnd < videoEnd) {
                const silenceDuration = (videoEnd - audioEnd).toFixed(3);
                await ffmpeg.exec([
                    '-f', 'lavfi',
                    '-i', `anullsrc=channel_layout=stereo:sample_rate=44100:d=${silenceDuration}`,
                    'silence.mp3'
                ]);

                await ffmpeg.writeFile(
                    'concat_audio.txt',
                    new TextEncoder().encode("file 'audio_processed.mp3'\nfile 'silence.mp3'")
                );

                await ffmpeg.exec([
                    '-f', 'concat',
                    '-safe', '0',
                    '-i', 'concat_audio.txt',
                    '-c', 'copy',
                    'final_audio.mp3'
                ]);
            } else {
                await ffmpeg.rename('audio_processed.mp3', 'final_audio.mp3');
            }

            // 4. Xử lý khi audio dài hơn video (thêm video đen)

            await ffmpeg.rename('video_processed.mp4', 'final_video.mp4');

            // 5. Merge final
            await ffmpeg.exec([
                '-i', 'final_video.mp4',
                '-i', 'final_audio.mp3',
                '-c:v', 'copy',
                '-c:a', 'aac',
                'output.mp4'
            ]);

            // Output
            const data = await ffmpeg.readFile('output.mp4');
            const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
            setState(prev => ({ ...prev, outputUrl: url }));

            message.success('Video and audio merged perfectly!');
        } catch (err) {
            console.error('Merge error:', err);
            setState(prev => ({ ...prev, error: err.message || 'Merge failed' }));
            message.error('Failed to merge video and audio');
        } finally {
            setState(prev => ({ ...prev, isProcessing: false }));
        }
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleRangeChange = (type, values) => {
        if (!Array.isArray(values)) return;

        const [start, end] = values;
        const maxAllowed = type === 'video'
            ? initialVideoDurationRef.current
            : initialAudioDurationRef.current;

        const prevStart = state[`${type}Start`];
        const prevEnd = state[`${type}End`];

        const isStartChanged = Math.abs(start - prevStart) > Math.abs(end - prevEnd);

        let adjustedStart = start;
        let adjustedEnd = end;

        if (end - start > maxAllowed) {
            if (isStartChanged) {
                adjustedEnd = adjustedStart + maxAllowed;
            } else {
                adjustedStart = adjustedEnd - maxAllowed;
            }
        }

        setState(prev => ({
            ...prev,
            [`${type}Start`]: adjustedStart,
            [`${type}End`]: adjustedEnd
        }));
    };

    const renderTimelineSection = (type) => {
        const range = [state[`${type}Start`], state[`${type}End`]];
        const duration = state[`${type}Duration`];
        const maxDuration = Math.max(state.videoDuration || 0, state.audioDuration || 0, state.videoDuration + state.audioDuration);
        const color = type === 'video' ? '#4CAF50' : '#2196F3';


        const renderTrack = ({ props, children }) => {
            const [start, end] = range;
            const rangeStart = (start / maxDuration) * 100;
            const rangeEnd = (end / maxDuration) * 100;

            // Destructure key from props
            const { key, ...restProps } = props;

            return (
                <div
                    key={key} // Pass key directly
                    {...restProps} // Spread the rest
                    style={{
                        ...restProps.style,
                        height: '6px',
                        width: '100%',
                        background: `
                            linear-gradient(
                                to right,
                                #ccc 0%,
                                #ccc ${rangeStart}%,
                                ${color} ${rangeStart}%,
                                ${color} ${rangeEnd}%,
                                #ccc ${rangeEnd}%,
                                #ccc 100%
                            )
                        `,
                        borderRadius: '999px',
                    }}
                >
                    {children}
                </div>
            );
        };

        const renderThumb = ({ props }) => {
            const { key, ...restProps } = props;

            return (
                <div
                    key={key}
                    {...restProps}
                    style={{
                        ...restProps.style,
                        height: '18px',
                        width: '18px',
                        backgroundColor: '#fff',
                        border: `2px solid ${color}`,
                        borderRadius: '50%',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                />
            );
        };


        return (
            <div style={styles.timelineSection}>
                <div style={styles.timelineHeader}>
                    <span>{type.charAt(0).toUpperCase() + type.slice(1)}: {formatTime(range[0])} - {formatTime(range[1])}</span>
                    <span style={styles.durationText}>
                        Duration: {formatTime(range[1] - range[0])}
                    </span>
                </div>
                {duration > 0 && (
                    <Range
                        step={0.1}
                        min={0}
                        max={maxDuration}
                        values={range}
                        onChange={(values) => handleRangeChange(type, values)} // ✅ đúng cú pháp
                        onFinalChange={() => setState(prev => ({ ...prev, activeThumb: null }))}
                        renderTrack={renderTrack}
                        renderThumb={renderThumb}
                    />
                )}
            </div>
        );
    };

    return (
        <div style={{ background: "#ebebec" }}>
            <StickyHeader title="Video Editor" />

            <Flex
                vertical
                align="center"
                gap="small"
                style={{
                    borderRadius: "10px",
                    minHeight: "calc(100vh - 200px)",
                    width: "100%",
                    padding: "20px",
                }}
            >
                {videoList.length === 0 ? (
                    <EmptyDisplay />
                ) : (
                    <VideoList
                        videos={videoList}
                        selectedVideoId={selectedVideoId}
                        onVideoClick={handleSelectVideo}
                    />
                )}

                <div style={styles.container} >
                    {/* Error Message */}
                    {state.error && (
                        <div style={styles.error}>
                            {state.error}
                            <button
                                onClick={() => setState((prev) => ({ ...prev, error: null }))}
                                style={styles.errorClose}
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {/* Audio Input */}
                    <div style={styles.inputGroup}>
                        <div style={styles.inputContainer}>
                            <label style={styles.label}>Select Audio:</label>
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => handleFileChange("audio", e)}
                                disabled={state.isProcessing}
                                style={styles.input}
                            />
                        </div>
                    </div>

                    {/* Main Video Preview */}
                    <div style={styles.mainPreviewContainer} ref={previewRef}>
                        {state.videoPreviewUrl ? (
                            <>
                                <video
                                    ref={previewVideoRef}
                                    src={state.videoPreviewUrl}
                                    controls={false}
                                    style={styles.mainPreviewVideo}
                                    onClick={togglePlayback}
                                />
                                <div style={styles.mainPreviewControls}>
                                    <button
                                        onClick={togglePlayback}
                                        style={{
                                            ...styles.playButton,
                                            ...(!state.videoPreviewUrl ? styles.buttonDisabled : {}),
                                        }}
                                        disabled={!state.videoPreviewUrl}
                                    >
                                        {state.isPlaying ? "⏸ Pause" : "▶️ Play"}
                                    </button>
                                    <span style={styles.timeDisplay}>
                                        {formatTime(state.currentTime)}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div style={styles.previewPlaceholder}>Select a video to preview</div>
                        )}
                    </div>

                    {/* Timelines */}
                    <div style={styles.combinedTimelineContainer}>
                        <div style={{ marginBottom: '24px' }}>
                            {renderTimelineSection('video')}
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            {renderTimelineSection('audio')}
                        </div>
                        <div style={styles.playbackIndicatorContainer}>
                            <div
                                style={{
                                    ...styles.playbackIndicator,
                                    left: `${(state.currentTime /
                                        (state.videoDuration + state.audioDuration)) *
                                        100
                                        }%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Merge Button */}
                    <button
                        style={{
                            ...styles.button,
                            ...((state.isProcessing || !state.videoFile || !state.audioFile) &&
                                styles.buttonDisabled),
                        }}
                        onClick={mergeMedia}
                        disabled={state.isProcessing || !state.videoFile || !state.audioFile}
                    >
                        {state.isProcessing
                            ? `Processing... ${state.progress}%`
                            : "Merge Video & Audio"}
                    </button>

                    {/* Result Section */}
                    {state.outputUrl && (
                        <div style={styles.resultContainer}>
                            <h3 style={styles.subHeader}>Result:</h3>
                            <video src={state.outputUrl} controls style={styles.video} />
                            <a
                                href={state.outputUrl}
                                download="merged_video.mp4"
                                style={styles.downloadButton}
                            >
                                Download Result
                            </a>
                        </div>
                    )}
                </div>
            </Flex>

            {/* Hidden Audio Preview */}
            {state.audioPreviewUrl && (
                <audio ref={previewAudioRef} src={state.audioPreviewUrl} />
            )}
        </div>
    );
};

const styles = {
    container: {
        maxWidth: "800px",
        width: "100%",
        margin: "0 auto",
        padding: "20px",
        backgroundColor: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    error: {
        color: "#ff4444",
        backgroundColor: "#ffeeee",
        padding: "10px",
        borderRadius: "4px",
        marginBottom: "15px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    errorClose: {
        background: "none",
        border: "none",
        fontSize: "18px",
        cursor: "pointer",
        color: "#ff4444",
    },
    inputGroup: {
        display: "flex",
        gap: "20px",
        marginBottom: "20px",
    },
    inputContainer: {
        flex: 1,
    },
    label: {
        display: "block",
        marginBottom: "8px",
        fontWeight: "600",
        color: "#333",
    },
    input: {
        width: "100%",
        padding: "10px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "14px",
    },
    mainPreviewContainer: {
        position: "relative",
        marginBottom: "20px",
        backgroundColor: "#000",
        borderRadius: "8px",
        overflow: "hidden",
        minHeight: "300px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    mainPreviewVideo: {
        width: "100%",
        display: "block",
        cursor: "pointer",
        maxHeight: "500px",
    },
    mainPreviewControls: {
        position: "absolute",
        bottom: "0",
        left: "0",
        right: "0",
        padding: "10px",
        background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "15px",
    },
    timeDisplay: {
        color: "#fff",
        fontSize: "14px",
        fontWeight: "600",
    },
    previewPlaceholder: {
        color: "#999",
        fontSize: "16px",
    },
    playButton: {
        backgroundColor: "#2196F3",
        color: "white",
        border: "none",
        padding: "8px 16px",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "16px",
        fontWeight: "600",
    },
    combinedTimelineContainer: {
        margin: "20px 0",
        padding: "15px",
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    playbackIndicatorContainer: {
        position: "relative",
        height: "3px",
        backgroundColor: "#eee",
        marginTop: "20px",
        borderRadius: "2px",
    },
    playbackIndicator: {
        position: "absolute",
        top: "-5px",
        width: "12px",
        height: "12px",
        backgroundColor: "#ff5722",
        borderRadius: "50%",
        transform: "translateX(-50%)",
    },
    button: {
        backgroundColor: "#4CAF50",
        color: "white",
        border: "none",
        padding: "12px 20px",
        fontSize: "16px",
        cursor: "pointer",
        borderRadius: "4px",
        transition: "background-color 0.3s",
        width: "100%",
        marginTop: "20px",
        fontWeight: "600",
    },
    buttonDisabled: {
        backgroundColor: "#a5d6a7",
        cursor: "not-allowed",
    },
    resultContainer: {
        marginTop: "30px",
        borderTop: "1px solid #eee",
        paddingTop: "20px",
    },
    subHeader: {
        color: "#333",
        marginBottom: "15px",
        fontSize: "18px",
    },
    video: {
        width: "100%",
        maxHeight: "500px",
        backgroundColor: "#000",
        margin: "15px 0",
        borderRadius: "4px",
    },
    downloadButton: {
        display: "inline-block",
        backgroundColor: "#2196F3",
        color: "white",
        padding: "10px 15px",
        textDecoration: "none",
        borderRadius: "4px",
        transition: "background-color 0.3s",
        marginTop: "10px",
        fontWeight: "600",
    },
};

export default VideoEditor;