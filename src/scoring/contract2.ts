import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import type { PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import type { Contract2Output, Landmark } from "./types";
import { computePostureScore } from "./postureScore";
import { computeGazeScore } from "./gazeScore";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function toLandmarks(
  raw: { x: number; y: number; z: number; visibility?: number }[]
): Landmark[] {
  return raw.map((p) => ({
    x: p.x,
    y: p.y,
    z: p.z,
    visibility: p.visibility,
  }));
}

export function buildContract2(
  faceResults: FaceLandmarkerResult | null,
  poseResults: PoseLandmarkerResult | null,
  frameRate: number
): Contract2Output {
  const faceDetected =
    !!faceResults && faceResults.faceLandmarks.length > 0;
  const poseDetected =
    !!poseResults && poseResults.landmarks.length > 0;

  const faceLandmarks = faceDetected
    ? faceResults.faceLandmarks.map(toLandmarks)
    : null;
  const poseLandmarks = poseDetected
    ? poseResults.landmarks.map(toLandmarks)
    : null;

  const posture = poseDetected
    ? computePostureScore(poseLandmarks![0])
    : { shoulderTilt: 0, shoulderLevelScore: 0, forwardLeanScore: 0, overallScore: 0 };

  const gaze = faceDetected
    ? computeGazeScore(faceLandmarks![0])
    : { horizontalRatio: 0.5, verticalRatio: 0.5, consistencyScore: 0, lookingAtCamera: false };

  const composite = clamp01(
    (poseDetected ? posture.overallScore : 0) * 0.5 +
    (faceDetected ? gaze.consistencyScore : 0) * 0.5
  );

  return {
    timestamp: Date.now(),
    frameRate: Math.round(frameRate),
    detection: {
      faceDetected,
      poseDetected,
      faceCount: faceResults?.faceLandmarks.length ?? 0,
    },
    scores: {
      posture,
      gaze,
      composite: Math.round(composite * 100) / 100,
    },
    raw: {
      faceLandmarks,
      poseLandmarks,
    },
  };
}
