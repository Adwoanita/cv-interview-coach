import { useCallback, useEffect, useRef, useState } from "react";
import { useWebcam } from "../hooks/useWebcam";
import {
  useFaceLandmarker,
  type FaceLandmarkerResult,
} from "../hooks/useFaceLandmarker";
import "./WebcamFaceMesh.css";

const DOT_RADIUS = 1.5;
const DOT_COLOR = "#00FF88";

export function WebcamFaceMesh() {
  const { videoRef, error: webcamError, isReady: webcamReady } = useWebcam();
  const {
    landmarker,
    isLoading: modelLoading,
    error: modelError,
  } = useFaceLandmarker();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const [fps, setFps] = useState(0);
  const [detecting, setDetecting] = useState(true);
  const [faceCount, setFaceCount] = useState(0);

  const drawLandmarks = useCallback(
    (ctx: CanvasRenderingContext2D, results: FaceLandmarkerResult) => {
      const { width, height } = ctx.canvas;
      ctx.clearRect(0, 0, width, height);

      setFaceCount(results.faceLandmarks.length);

      for (const landmarks of results.faceLandmarks) {
        for (const point of landmarks) {
          const x = point.x * width;
          const y = point.y * height;

          ctx.beginPath();
          ctx.arc(x, y, DOT_RADIUS, 0, 2 * Math.PI);
          ctx.fillStyle = DOT_COLOR;
          ctx.fill();
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!webcamReady || !landmarker || !detecting) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = performance.now();
    let frameCount = 0;

    function detect() {
      if (!video || !canvas || !ctx || !landmarker) return;

      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const now = performance.now();
        const results = landmarker.detectForVideo(video, now);
        drawLandmarks(ctx, results);

        frameCount++;
        const elapsed = now - lastTime;
        if (elapsed >= 1000) {
          setFps(Math.round((frameCount * 1000) / elapsed));
          frameCount = 0;
          lastTime = now;
        }
      }

      animFrameRef.current = requestAnimationFrame(detect);
    }

    animFrameRef.current = requestAnimationFrame(detect);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [webcamReady, landmarker, detecting, videoRef, drawLandmarks]);

  const error = webcamError || modelError;

  if (error) {
    return (
      <div className="wfm-error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="wfm-container">
      <div className="wfm-header">
        <h1>Face Mesh Detection</h1>
        <div className="wfm-controls">
          <button
            type="button"
            className={`wfm-btn ${detecting ? "wfm-btn--active" : ""}`}
            onClick={() => setDetecting((d) => !d)}
            disabled={modelLoading || !webcamReady}
          >
            {detecting ? "Stop Detection" : "Start Detection"}
          </button>
          <span className="wfm-stat">FPS: {fps}</span>
          <span className="wfm-stat">
            Faces: {faceCount}
          </span>
        </div>
      </div>

      <div className="wfm-video-wrap">
        {(modelLoading || !webcamReady) && (
          <div className="wfm-loading">
            {!webcamReady && <p>Starting webcam…</p>}
            {modelLoading && <p>Loading Face Mesh model…</p>}
          </div>
        )}
        <video
          ref={videoRef}
          className="wfm-video"
          autoPlay
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="wfm-canvas" />
      </div>
    </div>
  );
}
