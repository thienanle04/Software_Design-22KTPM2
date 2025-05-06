import React, { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import StickyHeader from './StickyHeader';
import { Range } from 'react-range';

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
        isVideoPlaying: false,
        isAudioPlaying: false
    });

    const ffmpegRef = useRef(null);
    const previewVideoRef = useRef(null);
    const previewAudioRef = useRef(null);

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

    // Handlers
    const handleFileChange = async (type, e) => {
        const file = e.target.files[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        const mediaElement = type === 'video'
            ? document.createElement('video')
            : new Audio(url);

        mediaElement.onloadedmetadata = () => {
            setState(prev => ({
                ...prev,
                [`${type}File`]: file,
                [`${type}PreviewUrl`]: url,
                [`${type}Duration`]: mediaElement.duration,
                [`${type}End`]: mediaElement.duration,
                error: null
            }));
        };

        if (type === 'video') mediaElement.src = url;
    };

    const togglePlayback = (type) => {
        const ref = type === 'video' ? previewVideoRef : previewAudioRef;
        const isPlaying = state[`is${type.charAt(0).toUpperCase() + type.slice(1)}Playing`];

        if (ref.current) {
            if (isPlaying) {
                ref.current.pause();
            } else {
                ref.current.currentTime = state[`${type}Start`];
                ref.current.play();
            }
            setState(prev => ({ ...prev, [`is${type.charAt(0).toUpperCase() + type.slice(1)}Playing`]: !isPlaying }));
        }
    };

    // Timeline effects
    useEffect(() => {
        const handleTimeUpdate = (type) => () => {
            const ref = type === 'video' ? previewVideoRef : previewAudioRef;
            if (ref.current?.currentTime >= state[`${type}End`]) {
                ref.current.pause();
                setState(prev => ({ ...prev, [`is${type.charAt(0).toUpperCase() + type.slice(1)}Playing`]: false }));
            }
        };

        const videoListener = handleTimeUpdate('video');
        const audioListener = handleTimeUpdate('audio');

        previewVideoRef.current?.addEventListener('timeupdate', videoListener);
        previewAudioRef.current?.addEventListener('timeupdate', audioListener);

        return () => {
            previewVideoRef.current?.removeEventListener('timeupdate', videoListener);
            previewAudioRef.current?.removeEventListener('timeupdate', audioListener);
        };
    }, [state.videoEnd, state.audioEnd]);

    const mergeMedia = async () => {
        try {
            setState(prev => ({ ...prev, isProcessing: true, error: null }));

            const { videoFile, audioFile, videoStart, videoEnd, audioStart, audioEnd } = state;
            const ffmpeg = ffmpegRef.current;

            await Promise.all([
                ffmpeg.writeFile('input.mp4', await fetchFile(videoFile)),
                ffmpeg.writeFile('audio.mp3', await fetchFile(audioFile))
            ]);

            const videoDuration = videoEnd - videoStart;
            const audioDuration = audioEnd - audioStart;
            const outputDuration = Math.max(videoDuration, audioDuration);

            await ffmpeg.exec([
                // Input video with trimming
                '-ss', videoStart.toString(),
                '-t', videoDuration.toString(),
                '-i', 'input.mp4',

                // Input audio with independent trimming
                '-ss', audioStart.toString(),
                '-t', audioDuration.toString(),
                '-i', 'audio.mp3',

                // Process audio (pad with silence if needed)
                '-filter_complex',
                `[1:a]apad=whole_dur=${outputDuration}[padded_audio]`,

                // Combine streams
                '-map', '0:v',
                '-map', '[padded_audio]',

                // Output settings
                '-c:v', 'copy',
                '-c:a', 'aac',
                '-shortest',
                'output.mp4'
            ]);

            const data = await ffmpeg.readFile('output.mp4');
            const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));

            setState(prev => ({ ...prev, outputUrl: url }));
        } catch (err) {
            setState(prev => ({ ...prev, error: err.message }));
        } finally {
            setState(prev => ({ ...prev, isProcessing: false }));
        }
    };

    // Helper functions
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleRangeChange = (type, values) => {
        setState(prev => ({
            ...prev,
            [`${type}Start`]: values[0],
            [`${type}End`]: values[1]
        }));
    };

    // Render function for timeline
    const renderTimeline = (type) => {
        const duration = state[`${type}Duration`];
        const start = state[`${type}Start`];
        const end = state[`${type}End`];
        const mediaRef = type === 'video' ? previewVideoRef : previewAudioRef;

        const handleStartChange = (newStart) => {
            setState(prev => ({
                ...prev,
                [`${type}Start`]: newStart
            }));

            // Cập nhật preview khi thay đổi điểm bắt đầu
            if (mediaRef.current) {
                mediaRef.current.currentTime = newStart;
                if (state[`is${type.charAt(0).toUpperCase() + type.slice(1)}Playing`]) {
                    mediaRef.current.play();
                }
            }
        };

        const handleEndChange = (newEnd) => {
            setState(prev => ({
                ...prev,
                [`${type}End`]: newEnd
            }));

            // Dừng phát nếu đang vượt quá điểm kết thúc mới
            if (mediaRef.current && mediaRef.current.currentTime > newEnd) {
                mediaRef.current.pause();
                setState(prev => ({
                    ...prev,
                    [`is${type.charAt(0).toUpperCase() + type.slice(1)}Playing`]: false
                }));
            }
        };

        const handleRangeChange = (values) => {
            const [newStart, newEnd] = values;
            handleStartChange(newStart);
            handleEndChange(newEnd);
        };

        return (
            <div style={styles.timelineContainer}>
                <div style={styles.timelineHeader}>
                    <span>Start: {formatTime(start)}</span>
                    <span style={styles.durationText}>Duration: {formatTime(end - start)}</span>
                    <span>End: {formatTime(end)}</span>
                </div>

                <Range
                    step={0.1}
                    min={0}
                    max={duration}
                    values={[start, end]}
                    onChange={handleRangeChange}
                    renderTrack={({ props: trackProps, children }) => {
                        const { key, ...restTrackProps } = trackProps;
                        return (
                            <div
                                key={key}
                                {...restTrackProps}
                                style={{ ...restTrackProps.style, ...styles.timelineTrack }}
                            >
                                {children}
                            </div>
                        );
                    }}
                    renderThumb={({ props: thumbProps, isDragged }) => {
                        const { key, ...restThumbProps } = thumbProps;
                        return (
                            <div
                                key={key}
                                {...restThumbProps}
                                style={{
                                    ...restThumbProps.style,
                                    ...styles.timelineThumb,
                                    ...(isDragged ? styles.thumbDragging : {})
                                }}
                            />
                        );
                    }}
                />
            </div>
        );
    };

    return (
        <div>
            <StickyHeader title="Video Editor" />

            <div style={styles.container}>
                {state.error && <div style={styles.error}>{state.error}</div>}

                <div style={styles.inputGroup}>
                    {/* Video Input */}
                    <div style={styles.inputContainer}>
                        <label style={styles.label}>Select Video:</label>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleFileChange('video', e)}
                            disabled={state.isProcessing}
                            style={styles.input}
                        />

                        {state.videoPreviewUrl && (
                            <>
                                <video
                                    ref={previewVideoRef}
                                    src={state.videoPreviewUrl}
                                    controls={false}
                                    style={styles.previewVideo}
                                    onClick={() => togglePlayback('video')}
                                />
                                <div style={styles.previewControls}>
                                    <button
                                        onClick={() => togglePlayback('video')}
                                        style={styles.playButton}
                                    >
                                        {state.isVideoPlaying ? 'Pause' : 'Play'}
                                    </button>
                                    <span style={styles.previewTime}>
                                        {formatTime(state.videoStart)} - {formatTime(state.videoEnd)}
                                    </span>
                                </div>
                                {renderTimeline('video')}
                            </>
                        )}
                    </div>

                    {/* Audio Input */}
                    <div style={styles.inputContainer}>
                        <label style={styles.label}>Select Audio:</label>
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => handleFileChange('audio', e)}
                            disabled={state.isProcessing}
                            style={styles.input}
                        />

                        {state.audioPreviewUrl && (
                            <div style={styles.previewContainer}>
                                <div style={styles.audioWaveform}>
                                    <span style={styles.audioLabel}>Audio Track</span>
                                </div>
                                <div style={styles.previewControls}>
                                    <button
                                        onClick={() => togglePlayback('audio')}
                                        style={styles.playButton}
                                    >
                                        {state.isAudioPlaying ? 'Pause' : 'Play'}
                                    </button>
                                    <span style={styles.previewTime}>
                                        {formatTime(state.audioStart)} - {formatTime(state.audioEnd)}
                                    </span>
                                </div>
                                <audio
                                    ref={previewAudioRef}
                                    src={state.audioPreviewUrl}
                                />
                                {renderTimeline('audio')}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    style={{
                        ...styles.button,
                        ...((state.isProcessing || !state.videoFile || !state.audioFile) ? styles.buttonDisabled : {})
                    }}
                    onClick={mergeMedia}
                    disabled={state.isProcessing || !state.videoFile || !state.audioFile}
                >
                    {state.isProcessing ? `Processing... ${state.progress}%` : 'Merge Video & Audio'}
                </button>

                {state.outputUrl && (
                    <div style={styles.resultContainer}>
                        <h3 style={styles.subHeader}>Result:</h3>
                        <video
                            src={state.outputUrl}
                            controls
                            style={styles.video}
                        />
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
        </div>
    );
};

// Styles (optimized version)
const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px 20px 120px',
        fontFamily: 'Arial, sans-serif'
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
        marginTop: '20px'
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
        marginBottom: '15px'
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
        marginTop: '10px'
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
        fontSize: '14px'
    },
    durationText: {
        fontWeight: 'bold',
    },
    timelineTrack: {
        height: '6px',
        width: '100%',
        backgroundColor: '#ddd',
        borderRadius: '3px',
    },
    timelineThumb: {
        height: '16px',
        width: '16px',
        backgroundColor: '#4285f4',
        borderRadius: '50%',
        outline: 'none'
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
        margin: '10px 0',
    },
    playButton: {
        backgroundColor: '#2196F3',
        color: 'white',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px'
    },
    previewTime: {
        color: '#666',
        fontSize: '0.9em',
    },
};

export default VideoEditor;