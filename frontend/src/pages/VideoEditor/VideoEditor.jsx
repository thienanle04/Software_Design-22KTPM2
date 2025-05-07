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
        isPlaying: false, // Thay thế 2 state riêng bằng 1 state chung
        currentTime: 0,
        activeThumb: null,
    });

    const ffmpegRef = useRef(null);
    const previewVideoRef = useRef(null);
    const previewAudioRef = useRef(null);
    const animationFrameRef = useRef(null);
    const mainContainerRef = useRef(null);
    const initialAudioDurationRef = useRef(null);
    const initialVideoDurationRef = useRef(null);
    const timeoutIdRef = useRef(null);

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

    const togglePlayback = () => {
        console.log('Toggle playback', state.isPlaying);
        console.log(state.currentTime, state.videoStart, state.audioStart);

        // Nếu đang chơi, dừng playback
        if (state.isPlaying) {
            previewVideoRef.current?.pause();
            previewAudioRef.current?.pause();
            if (timeoutIdRef.current != null) {
                clearTimeout(timeoutIdRef.current);
                console.log('Cleared timeout:', timeoutIdRef.current);
                timeoutIdRef.current = null;
            }
            cancelAnimationFrame(animationFrameRef.current);
        } else {
            // Nếu không chơi, bắt đầu chơi từ thời gian gốc
            if (previewVideoRef.current) {
                previewVideoRef.current.currentTime = 0;
                previewVideoRef.current.play();
            }

            if (previewAudioRef.current) {
                const audioOffset = state.videoStart - state.audioStart;

                if (audioOffset >= 0) {
                    // Video bắt đầu sau audio → play audio từ giữa
                    previewAudioRef.current.currentTime = audioOffset;
                    previewAudioRef.current.play();
                } else {
                    // Video bắt đầu trước audio → delay audio
                    previewAudioRef.current.currentTime = 0;

                    // Chơi audio sau khi delay (dựa vào thời gian video bắt đầu trước audio)
                    timeoutIdRef.current = setTimeout(() => {
                        previewAudioRef.current?.play();
                    }, -audioOffset * 1000);
                    console.log('Set timeout:', timeoutIdRef.current);
                }
            }

            const startTimestamp = performance.now();
            const updateTime = () => {
                const now = performance.now();
                const elapsed = (now - startTimestamp) / 1000;

                const currentTime = state.videoStart + elapsed;

                setState(prev => ({ ...prev, currentTime }));

                // Dừng khi vượt videoEnd (gốc là video)
                if (currentTime >= state.videoEnd) {
                    previewVideoRef.current?.pause();
                    previewAudioRef.current?.pause();
                    cancelAnimationFrame(animationFrameRef.current);
                    setState(prev => ({ ...prev, isPlaying: false }));
                } else {
                    animationFrameRef.current = requestAnimationFrame(updateTime);
                }
            };

            animationFrameRef.current = requestAnimationFrame(updateTime);
        }

        setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    };

    useEffect(() => {
        const video = previewVideoRef.current;
        const audio = previewAudioRef.current;

        const onVideoTimeUpdate = () => {
            if (video.currentTime >= state.videoEnd) {
                video.pause();
                audio.pause();
            }
        };

        const onAudioTimeUpdate = () => {
            if (audio.currentTime >= state.audioEnd) {
                audio.pause();
            }
        };

        if (video) video.addEventListener('timeupdate', onVideoTimeUpdate);
        if (audio) audio.addEventListener('timeupdate', onAudioTimeUpdate);

        return () => {
            if (video) video.removeEventListener('timeupdate', onVideoTimeUpdate);
            if (audio) audio.removeEventListener('timeupdate', onAudioTimeUpdate);
        };
    }, [state.videoEnd, state.audioEnd]);

    useEffect(() => {
        if (
            state.audioDuration > 0 &&
            state.audioEnd > state.audioStart &&
            initialAudioDurationRef.current === null
        ) {
            initialAudioDurationRef.current = state.audioEnd - state.audioStart;
        }

        if (
            state.videoDuration > 0 &&
            state.videoEnd > state.videoStart &&
            initialVideoDurationRef.current === null
        ) {
            initialVideoDurationRef.current = state.videoEnd - state.videoStart;
        }
    }, [state.audioDuration, state.videoDuration, state.audioStart, state.audioEnd, state.videoStart, state.videoEnd]);

    // Timeline effects
    useEffect(() => {
        return () => {
            cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

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

            const padStart = Math.max(0, audioStart - videoStart);
            const padEnd = Math.max(0, videoEnd - audioEnd); // phần cần kéo dài video
            const effectiveAudioStart = Math.max(0, videoStart - audioStart);
            const trimmedAudioDuration = audioDuration - effectiveAudioStart;
            const finalDuration = Math.max(0, audioEnd - videoEnd);

            console.log(videoStart, videoEnd, audioStart, audioEnd);
            console.log('Pad Start:', padStart, 'Pad End:', padEnd);

            await ffmpeg.exec([
                // Trim video
                '-ss', '0',
                '-t', videoDuration.toString(),
                '-i', 'input.mp4',

                // Trim audio
                '-ss', effectiveAudioStart.toString(),
                '-t', trimmedAudioDuration.toString(),
                '-i', 'audio.mp3',

                // Filter complex
                '-filter_complex',
                `[0:v]tpad=stop_mode=clone:stop_duration=${padEnd},setpts=PTS-STARTPTS[vout];` +
                `[1:a]adelay=${padStart * 1000}|${padStart * 1000},apad=pad_dur=${finalDuration}[aout]`,

                // Map output
                '-map', '[vout]',
                '-map', '[aout]',
                '-c:v', 'libx264',
                '-c:a', 'aac',
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

    const renderCombinedTimeline = () => {
        const maxDuration = Math.max(state.videoDuration || 0, state.audioDuration || 0);
        const totalDuration = (state.videoDuration || 0) + (state.audioDuration || 0);

        const videoRange = [
            state.videoStart,
            state.videoEnd
        ];
        const audioRange = [
            state.audioStart,
            state.audioEnd
        ];

        const handleVideoRangeChange = (values) => {
            const maxAllowed = initialVideoDurationRef.current;
            let [start, end] = values;
            const { videoStart, videoEnd } = state;
            const isStartChanged = Math.abs(start - videoStart) > Math.abs(end - videoEnd);

            if (end - start > maxAllowed) {
                if (isStartChanged) {
                    end = start + maxAllowed;
                } else {
                    start = end - maxAllowed;
                }
            }

            setState(prev => ({
                ...prev,
                videoStart: start,
                videoEnd: end
            }));
        };

        const handleAudioRangeChange = (values) => {
            const maxAllowed = initialAudioDurationRef.current;
            let [start, end] = values;
            const { audioStart, audioEnd } = state;
            const isStartChanged = Math.abs(start - audioStart) > Math.abs(end - audioEnd);

            if (end - start > maxAllowed) {
                if (isStartChanged) {
                    end = start + maxAllowed;
                } else {
                    start = end - maxAllowed;
                }
            }

            setState(prev => ({
                ...prev,
                audioStart: start,
                audioEnd: end
            }));
        };

        const renderThumbWithKeyFix = () => ({ props }) => {
            const { key, ...rest } = props;
            return <div key={key} {...rest} style={{ ...rest.style, ...styles.timelineThumb }} />;
        };

        return (
            <div style={styles.combinedTimelineContainer}>
                {/* Video Timeline */}
                <div style={styles.timelineSection}>
                    <div style={styles.timelineHeader}>
                        <span>Video: {formatTime(state.videoStart)} - {formatTime(state.videoEnd)}</span>
                        <span style={styles.durationText}>
                            Duration: {formatTime(state.videoEnd - state.videoStart)}
                        </span>
                    </div>
                    {state.videoDuration > 0 && (
                        <Range
                            step={0.1}
                            min={0}
                            max={totalDuration}
                            values={videoRange}
                            onChange={handleVideoRangeChange}
                            renderTrack={renderTrackWithOverlay({
                                values: videoRange,
                                validUntil: state.videoDuration,
                                max: totalDuration,
                                color: '#4CAF50' // Màu xanh lá cho video
                            })}
                            renderThumb={renderThumbWithKeyFix()}
                        />
                    )}
                </div>

                {/* Audio Timeline */}
                <div style={styles.timelineSection}>
                    <div style={styles.timelineHeader}>
                        <span>Audio: {formatTime(state.audioStart)} - {formatTime(state.audioEnd)}</span>
                        <span style={styles.durationText}>
                            Duration: {formatTime(state.audioEnd - state.audioStart)}
                        </span>
                    </div>
                    {state.audioDuration > 0 && (
                        <Range
                            step={0.1}
                            min={0}
                            max={totalDuration}
                            values={audioRange}
                            onChange={handleAudioRangeChange}
                            renderTrack={renderTrackWithOverlay({
                                values: audioRange,
                                validUntil: state.audioDuration,
                                max: totalDuration,
                                color: '#2196F3' // Màu xanh dương cho audio
                            })}
                            renderThumb={renderThumbWithKeyFix()}
                        />
                    )}
                </div>

                {/* Playback Indicator */}
                <div style={styles.playbackIndicatorContainer}>
                    <div
                        style={{
                            ...styles.playbackIndicator,
                            left: `${(state.currentTime / totalDuration) * 100}%`
                        }}
                    />
                </div>
            </div>
        );
    };

    const renderTrackWithOverlay = ({ values, validUntil, max, color }) =>
        ({ props, children }) => {
            const [start, end] = values;
            const rangeStart = (start / max) * 100;
            const rangeEnd = (end / max) * 100;
            const validPercent = (validUntil / max) * 100;

            return (
                <div
                    {...props}
                    style={{
                        ...props.style,
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
                        position: 'relative',
                    }}
                >
                    {children}
                </div>
            );
        };

    return (
        <div ref={mainContainerRef}>
            <StickyHeader title="Video Editor" />

            <div style={styles.container}>
                {state.error && <div style={styles.error}>{state.error}</div>}

                {/* File Inputs */}
                <div style={styles.inputGroup}>
                    <div style={styles.inputContainer}>
                        <label style={styles.label}>Select Video:</label>
                        <input
                            type="file"
                            accept="*"
                            onChange={(e) => handleFileChange('video', e)}
                            disabled={state.isProcessing}
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.inputContainer}>
                        <label style={styles.label}>Select Audio:</label>
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => handleFileChange('audio', e)}
                            disabled={state.isProcessing}
                            style={styles.input}
                        />
                    </div>
                </div>

                {/* Main Preview */}
                <div style={styles.mainPreviewContainer}>
                    {state.videoPreviewUrl && (
                        <video
                            ref={previewVideoRef}
                            src={state.videoPreviewUrl}
                            controls={false}
                            style={styles.mainPreviewVideo}
                            onClick={togglePlayback}
                        />
                    )}

                    <div style={styles.mainPreviewControls}>
                        <button
                            onClick={togglePlayback}
                            style={styles.playButton}
                            disabled={!state.videoFile || !state.audioFile}
                        >
                            {state.isPlaying ? (
                                <span>⏸ Pause</span>
                            ) : (
                                <span>▶️ Play ({formatTime(state.currentTime)})</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Combined Timeline */}
                {renderCombinedTimeline()}

                {/* Hidden audio element for playback */}
                {state.audioPreviewUrl && (
                    <audio
                        ref={previewAudioRef}
                        src={state.audioPreviewUrl}
                    />
                )}

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

// Updated styles
const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
    },
    error: {
        color: '#ff4444',
        backgroundColor: '#ffeeee',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '15px',
    },
    mainPreviewContainer: {
        position: 'relative',
        marginBottom: '20px',
        backgroundColor: '#000',
        borderRadius: '8px',
        overflow: 'hidden'
    },
    mainPreviewVideo: {
        width: '100%',
        display: 'block',
        cursor: 'pointer'
    },
    mainPreviewControls: {
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        padding: '10px',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
        display: 'flex',
        justifyContent: 'center'
    },
    combinedTimelineContainer: {
        margin: '20px 0',
        padding: '15px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    timelineSection: {
        marginBottom: '25px',
        width: '100%',
    },
    timelineHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
        fontSize: '14px',
        color: '#555'
    },
    durationText: {
        fontWeight: 'bold'
    },
    timelineTrack: {
        height: '8px',
        width: '100%',
        borderRadius: '4px',
    },
    timelineThumb: {
        height: '18px',
        width: '18px',
        backgroundColor: '#fff',
        borderRadius: '50%',
        border: '2px solid #555',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    },
    playbackIndicatorContainer: {
        position: 'relative',
        height: '3px',
        backgroundColor: '#eee',
        marginTop: '20px',
        borderRadius: '2px'
    },
    playbackIndicator: {
        position: 'absolute',
        top: '-5px',
        width: '12px',
        height: '12px',
        backgroundColor: '#ff5722',
        borderRadius: '50%',
        transform: 'translateX(-50%)'
    },
    inputGroup: {
        display: 'flex',
        gap: '20px',
        marginBottom: '20px'
    },
    inputContainer: {
        flex: 1
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontWeight: '600',
        color: '#333'
    },
    input: {
        width: '100%',
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px'
    },
    button: {
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        padding: '12px 20px',
        fontSize: '16px',
        cursor: 'pointer',
        borderRadius: '4px',
        transition: 'background-color 0.3s',
        width: '100%',
        marginTop: '20px',
        fontWeight: '600'
    },
    buttonDisabled: {
        backgroundColor: '#a5d6a7',
        cursor: 'not-allowed'
    },
    playButton: {
        backgroundColor: '#2196F3',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    resultContainer: {
        marginTop: '30px',
        borderTop: '1px solid #eee',
        paddingTop: '20px'
    },
    subHeader: {
        color: '#333',
        marginBottom: '15px',
        fontSize: '18px'
    },
    video: {
        width: '100%',
        maxHeight: '500px',
        backgroundColor: '#000',
        margin: '15px 0',
        borderRadius: '4px'
    },
    downloadButton: {
        display: 'inline-block',
        backgroundColor: '#2196F3',
        color: 'white',
        padding: '10px 15px',
        textDecoration: 'none',
        borderRadius: '4px',
        transition: 'background-color 0.3s',
        marginTop: '10px',
        fontWeight: '600'
    }
};

export default VideoEditor;