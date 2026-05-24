import type { Landmark, GazeMetrics } from "./types";

// MediaPipe Face Mesh landmark indices for iris/eye
const LEFT_IRIS_CENTER = 468;
const RIGHT_IRIS_CENTER = 473;
const LEFT_EYE_INNER = 133;
const LEFT_EYE_OUTER = 33;
const LEFT_EYE_TOP = 159;
const LEFT_EYE_BOTTOM = 145;
const RIGHT_EYE_INNER = 362;
const RIGHT_EYE_OUTER = 263;
const RIGHT_EYE_TOP = 386;
const RIGHT_EYE_BOTTOM = 374;

const HISTORY_SIZE = 30;

let gazeHistory: { hRatio: number; vRatio: number }[] = [];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function irisRatio(
  iris: Landmark,
  inner: Landmark,
  outer: Landmark,
  top: Landmark,
  bottom: Landmark
): { horizontal: number; vertical: number } {
  const eyeWidth = Math.abs(outer.x - inner.x) || 0.001;
  const eyeHeight = Math.abs(top.y - bottom.y) || 0.001;

  // 0 = looking left/up, 0.5 = center, 1 = looking right/down
  const horizontal = (iris.x - outer.x) / eyeWidth;
  const vertical = (iris.y - top.y) / eyeHeight;

  return { horizontal: clamp01(horizontal), vertical: clamp01(vertical) };
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sqDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / values.length);
}

export function computeGazeScore(faceLandmarks: Landmark[]): GazeMetrics {
  // Iris landmarks require refinement (indices 468-477)
  if (faceLandmarks.length < 478) {
    return {
      horizontalRatio: 0.5,
      verticalRatio: 0.5,
      consistencyScore: 0.5,
      lookingAtCamera: true,
    };
  }

  const leftIris = faceLandmarks[LEFT_IRIS_CENTER];
  const rightIris = faceLandmarks[RIGHT_IRIS_CENTER];

  const leftRatio = irisRatio(
    leftIris,
    faceLandmarks[LEFT_EYE_INNER],
    faceLandmarks[LEFT_EYE_OUTER],
    faceLandmarks[LEFT_EYE_TOP],
    faceLandmarks[LEFT_EYE_BOTTOM]
  );

  const rightRatio = irisRatio(
    rightIris,
    faceLandmarks[RIGHT_EYE_INNER],
    faceLandmarks[RIGHT_EYE_OUTER],
    faceLandmarks[RIGHT_EYE_TOP],
    faceLandmarks[RIGHT_EYE_BOTTOM]
  );

  const hRatio = (leftRatio.horizontal + rightRatio.horizontal) / 2;
  const vRatio = (leftRatio.vertical + rightRatio.vertical) / 2;

  // Track gaze over time for consistency scoring
  gazeHistory.push({ hRatio, vRatio });
  if (gazeHistory.length > HISTORY_SIZE) {
    gazeHistory = gazeHistory.slice(-HISTORY_SIZE);
  }

  // Consistency: lower std dev = more consistent gaze = higher score
  const hStdDev = standardDeviation(gazeHistory.map((g) => g.hRatio));
  const vStdDev = standardDeviation(gazeHistory.map((g) => g.vRatio));
  const avgStdDev = (hStdDev + vStdDev) / 2;

  // Score: std dev of 0 = perfect (1.0), std dev > 0.15 = poor (0.0)
  const consistencyScore = clamp01(1 - avgStdDev / 0.15);

  // Looking at camera: iris near center of eye (0.4-0.6 range)
  const lookingAtCamera =
    hRatio > 0.35 && hRatio < 0.65 && vRatio > 0.3 && vRatio < 0.7;

  return {
    horizontalRatio: Math.round(hRatio * 100) / 100,
    verticalRatio: Math.round(vRatio * 100) / 100,
    consistencyScore: Math.round(consistencyScore * 100) / 100,
    lookingAtCamera,
  };
}

export function resetGazeHistory(): void {
  gazeHistory = [];
}
