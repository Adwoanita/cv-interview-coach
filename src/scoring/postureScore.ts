import type { Landmark, PostureMetrics } from "./types";

const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_EAR = 7;
const RIGHT_EAR = 8;
const NOSE = 0;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function shoulderLevelScore(landmarks: Landmark[]): number {
  const left = landmarks[LEFT_SHOULDER];
  const right = landmarks[RIGHT_SHOULDER];
  if (!left || !right) return 0;

  const dy = Math.abs(left.y - right.y);
  // Perfectly level = 0 diff. Tilt > 0.08 (~5-6 degrees) is poor.
  return clamp01(1 - dy / 0.08);
}

function shoulderTiltDegrees(landmarks: Landmark[]): number {
  const left = landmarks[LEFT_SHOULDER];
  const right = landmarks[RIGHT_SHOULDER];
  if (!left || !right) return 0;

  const dy = left.y - right.y;
  const dx = Math.abs(left.x - right.x) || 0.001;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

function forwardLeanScore(landmarks: Landmark[]): number {
  const nose = landmarks[NOSE];
  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];
  const leftEar = landmarks[LEFT_EAR];
  const rightEar = landmarks[RIGHT_EAR];

  if (!nose || !leftShoulder || !rightShoulder) return 0.5;

  // Use ear-to-shoulder depth if ears are visible
  if (leftEar && rightEar) {
    const avgEarZ = (leftEar.z + rightEar.z) / 2;
    const avgShoulderZ = (leftShoulder.z + rightShoulder.z) / 2;
    const lean = avgEarZ - avgShoulderZ;
    // Negative lean means ears are in front of shoulders (leaning forward)
    // Good posture: ears roughly above shoulders (lean near 0)
    return clamp01(1 - Math.abs(lean) / 0.15);
  }

  // Fallback: use nose y relative to shoulder midpoint y
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  const noseToShoulderDist = shoulderMidY - nose.y;
  // Good posture: nose well above shoulders. Score drops if too close.
  return clamp01(noseToShoulderDist / 0.25);
}

export function computePostureScore(landmarks: Landmark[]): PostureMetrics {
  const level = shoulderLevelScore(landmarks);
  const lean = forwardLeanScore(landmarks);
  const tilt = shoulderTiltDegrees(landmarks);

  // Weighted composite: shoulder level matters more for perceived posture
  const overallScore = clamp01(level * 0.6 + lean * 0.4);

  return {
    shoulderTilt: Math.round(tilt * 100) / 100,
    shoulderLevelScore: Math.round(level * 100) / 100,
    forwardLeanScore: Math.round(lean * 100) / 100,
    overallScore: Math.round(overallScore * 100) / 100,
  };
}
