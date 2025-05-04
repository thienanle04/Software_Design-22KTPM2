import React, { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const VideoEditor = () => {
    const [videoFile, setVideoFile] = useState(null);
    const [audioFile, setAudioFile] = useState(null);
    const [outputUrl, setOutputUrl] = useState(null);
    const [progress, setProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const ffmpegRef = useRef(null);
    const videoRef = useRef(null);

    // Khởi tạo FFmpeg
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
            if (outputUrl) {
                URL.revokeObjectURL(outputUrl);
            }
        };
    }, [outputUrl]);

    const handleVideoChange = (e) => {
        setVideoFile(e.target.files[0]);
        setError(null);
    };

    const handleAudioChange = (e) => {
        setAudioFile(e.target.files[0]);
        setError(null);
    };

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

            await ffmpeg.exec([
                '-i', 'input.mp4',
                '-i', 'audio.mp3',
                '-c:v', 'copy',
                '-c:a', 'aac',
                '-map', '0:v:0',
                '-map', '1:a:0',
                '-shortest',
                'output.mp4',
            ]);

            const data = await ffmpeg.readFile('output.mp4');
            const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
            setOutputUrl(url);
        } catch (err) {
            console.error('Merge error:', err);
            setError(`Error: ${err.message}. Please try different files.`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Video Editor</h1>

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.inputGroup}>
                <div style={styles.inputContainer}>
                    <label style={styles.label}>Select Video:</label>
                    <input
                        type="file"
                        accept="*"
                        onChange={handleVideoChange}
                        disabled={isProcessing}
                        style={styles.input}
                    />
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
    );
};

const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
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
};

export default VideoEditor;
