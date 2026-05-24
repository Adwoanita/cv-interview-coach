export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PostureMetrics {
  shoulderTilt: number;
  shoulderLevelScore: number;
  forwardLeanScore: number;
  overallScore: number;
}

export interface GazeMetrics {
  horizontalRatio: number;
  verticalRatio: number;
  consistencyScore: number;
  lookingAtCamera: boolean;
}

export interface Contract2Output {
  timestamp: number;
  frameRate: number;
  detection: {
    faceDetected: boolean;
    poseDetected: boolean;
    faceCount: number;
  };
  scores: {
    posture: PostureMetrics;
    gaze: GazeMetrics;
    composite: number;
  };
  raw: {
    faceLandmarks: Landmark[][] | null;
    poseLandmarks: Landmark[][] | null;
  };
}
