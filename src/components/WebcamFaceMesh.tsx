import { useCallback, useEffect, useRef, useState } from "react";
import { useWebcam } from "../hooks/useWebcam";
import { useFaceLandmarker } from "../hooks/useFaceLandmarker";
import { usePoseLandmarker } from "../hooks/usePoseLandmarker";
import { buildContract2 } from "../scoring/contract2";
import { resetGazeHistory } from "../scoring/gazeScore";
import type { Contract2Output } from "../scoring/types";
import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import type { PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import "./WebcamFaceMesh.css";

const FACE_DOT_RADIUS = 1.5;
const FACE_DOT_COLOR = "#00FF88";
const POSE_DOT_RADIUS = 4;
const POSE_DOT_COLOR = "#FF6B35";
const POSE_LINE_COLOR = "rgba(255, 107, 53, 0.5)";
const POSE_LINE_WIDTH = 2;

// MediaPipe Pose skeleton connections
const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27],
  [24, 26], [26, 28],
];

// Throttle console logging to once per second
const LOG_INTERVAL_MS = 1000;

export function WebcamFaceMesh() {
  const { videoRef, error: webcamError, isReady: webcamReady } = useWebcam();
  const {
    landmarker: faceLandmarker,
    isLoading: faceLoading,
    error: faceError,
  } = useFaceLandmarker();
  const {
    landmarker: poseLandmarker,
    isLoading: poseLoading,
    error: poseError,
  } = usePoseLandmarker();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastLogRef = useRef<number>(0);
  const [fps, setFps] = useState(0);
  const [detecting, setDetecting] = useState(true);
  const [faceCount, setFaceCount] = useState(0);
  const [poseDetected, setPoseDetected] = useState(false);
  const [contract2, setContract2] = useState<Contract2Output | null>(null);

  const drawFrame = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      faceResults: FaceLandmarkerResult | null,
      poseResults: PoseLandmarkerResult | null
    ) => {
      const { width, height } = ctx.canvas;
      ctx.clearRect(0, 0, width, height);

      // Draw pose skeleton and keypoints
      if (poseResults && poseResults.landmarks.length > 0) {
        for (const landmarks of poseResults.landmarks) {
          // Draw connections
          ctx.strokeStyle = POSE_LINE_COLOR;
          ctx.lineWidth = POSE_LINE_WIDTH;
          for (const [i, j] of POSE_CONNECTIONS) {
            const a = landmarks[i];
            const b = landmarks[j];
            if (
              a && b &&
              (a.visibility ?? 0) > 0.5 &&
              (b.visibility ?? 0) > 0.5
            ) {
              ctx.beginPath();
              ctx.moveTo(a.x * width, a.y * height);
              ctx.lineTo(b.x * width, b.y * height);
              ctx.stroke();
            }
          }

          // Draw keypoints
          for (const point of landmarks) {
            if ((point.visibility ?? 0) > 0.5) {
              ctx.beginPath();
              ctx.arc(
                point.x * width,
                point.y * height,
                POSE_DOT_RADIUS,
                0,
                2 * Math.PI
              );
              ctx.fillStyle = POSE_DOT_COLOR;
              ctx.fill();
            }
          }
        }
      }

      // Draw face landmarks
      if (faceResults) {
        for (const landmarks of faceResults.faceLandmarks) {
          for (const point of landmarks) {
            ctx.beginPath();
            ctx.arc(
              point.x * width,
              point.y * height,
              FACE_DOT_RADIUS,
              0,
              2 * Math.PI
            );
            ctx.fillStyle = FACE_DOT_COLOR;
            ctx.fill();
          }
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!detecting) {
      resetGazeHistory();
    }
  }, [detecting]);

  useEffect(() => {
    const modelsReady = faceLandmarker && poseLandmarker;
    if (!webcamReady || !modelsReady || !detecting) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = performance.now();
    let frameCount = 0;
    let currentFps = 0;

    function detect() {
      if (!video || !canvas || !ctx || !faceLandmarker || !poseLandmarker)
        return;

      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const now = performance.now();

        // Run both detectors
        const faceResults = faceLandmarker.detectForVideo(video, now);
        const poseResults = poseLandmarker.detectForVideo(video, now);

        drawFrame(ctx, faceResults, poseResults);

        // Update counters
        setFaceCount(faceResults.faceLandmarks.length);
        setPoseDetected(poseResults.landmarks.length > 0);

        // FPS calculation
        frameCount++;
        const elapsed = now - lastTime;
        if (elapsed >= 1000) {
          currentFps = Math.round((frameCount * 1000) / elapsed);
          setFps(currentFps);
          frameCount = 0;
          lastTime = now;
        }

        // Build Contract 2 JSON and log raw coordinates (throttled)
        if (now - lastLogRef.current >= LOG_INTERVAL_MS) {
          lastLogRef.current = now;
          const output = buildContract2(faceResults, poseResults, currentFps);
          setContract2(output);

          console.log(
            "[CV Coach] Raw Face Landmarks:",
            faceResults.faceLandmarks
          );
          console.log(
            "[CV Coach] Raw Pose Landmarks:",
            poseResults.landmarks
          );
          console.log("[CV Coach] Contract 2 JSON:", output);
        }
      }

      animFrameRef.current = requestAnimationFrame(detect);
    }

    animFrameRef.current = requestAnimationFrame(detect);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    webcamReady,
    faceLandmarker,
    poseLandmarker,
    detecting,
    videoRef,
    drawFrame,
  ]);

  const error = webcamError || faceError || poseError;
  const modelsLoading = faceLoading || poseLoading;

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
        <h1>CV Interview Coach</h1>
        <div className="wfm-controls">
          <button
            type="button"
            className={`wfm-btn ${detecting ? "wfm-btn--active" : ""}`}
            onClick={() => setDetecting((d) => !d)}
            disabled={modelsLoading || !webcamReady}
          >
            {detecting ? "Stop Detection" : "Start Detection"}
          </button>
          <span className="wfm-stat">FPS: {fps}</span>
          <span className="wfm-stat">Faces: {faceCount}</span>
          <span className="wfm-stat">
            Pose: {poseDetected ? "Yes" : "No"}
          </span>
        </div>
      </div>

      <div className="wfm-video-wrap">
        {(modelsLoading || !webcamReady) && (
          <div className="wfm-loading">
            {!webcamReady && <p>Starting webcam…</p>}
            {faceLoading && <p>Loading Face Mesh model…</p>}
            {poseLoading && <p>Loading Pose model…</p>}
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

      {contract2 && detecting && (
        <div className="wfm-scores">
          <div className="wfm-score-card">
            <h3>Posture</h3>
            <div className="wfm-score-value">
              {Math.round(contract2.scores.posture.overallScore * 100)}%
            </div>
            <div className="wfm-score-detail">
              Shoulder tilt: {contract2.scores.posture.shoulderTilt}°
            </div>
            <div className="wfm-score-detail">
              Level: {Math.round(contract2.scores.posture.shoulderLevelScore * 100)}%
            </div>
            <div className="wfm-score-detail">
              Lean: {Math.round(contract2.scores.posture.forwardLeanScore * 100)}%
            </div>
          </div>

          <div className="wfm-score-card">
            <h3>Gaze</h3>
            <div className="wfm-score-value">
              {Math.round(contract2.scores.gaze.consistencyScore * 100)}%
            </div>
            <div className="wfm-score-detail">
              Looking at camera:{" "}
              {contract2.scores.gaze.lookingAtCamera ? "Yes" : "No"}
            </div>
            <div className="wfm-score-detail">
              H-ratio: {contract2.scores.gaze.horizontalRatio}
            </div>
            <div className="wfm-score-detail">
              V-ratio: {contract2.scores.gaze.verticalRatio}
            </div>
          </div>

          <div className="wfm-score-card wfm-score-card--composite">
            <h3>Composite</h3>
            <div className="wfm-score-value wfm-score-value--large">
              {Math.round(contract2.scores.composite * 100)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
