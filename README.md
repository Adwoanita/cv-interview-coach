# CV Interview Coach — Computer Vision Module

Real-time facial landmark + body pose detection with posture and gaze scoring for interview coaching. Built with React + TypeScript + Vite + MediaPipe.

## Features

- **Live webcam feed** via `getUserMedia` (mirrored selfie view)
- **MediaPipe Face Mesh** — 478 facial landmarks as green dots
- **MediaPipe Pose** — 33 body keypoints as orange dots with skeleton connections
- **Posture scoring** — shoulder tilt, level, and forward lean analysis
- **Gaze consistency scoring** — iris tracking with temporal consistency measurement
- **Contract 2 JSON output** — structured scoring data logged to console every second
- **Real-time FPS counter**, face count, and pose detection status
- **Start/Stop toggle** for detection
- Supports up to 2 faces simultaneously

## Tech Stack

- React 19 + TypeScript
- Vite 8
- `@mediapipe/tasks-vision` (FaceLandmarker + PoseLandmarker)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in Chrome/Edge and allow camera access.

## Project Structure

```
src/
  hooks/
    useWebcam.ts            — webcam stream management
    useFaceLandmarker.ts    — MediaPipe FaceLandmarker initialization
    usePoseLandmarker.ts    — MediaPipe PoseLandmarker initialization
  scoring/
    types.ts                — Contract 2 JSON type definitions
    postureScore.ts         — posture scoring from shoulder keypoints
    gazeScore.ts            — gaze consistency scoring from eye/iris landmarks
    contract2.ts            — assembles full Contract 2 JSON output
  components/
    WebcamFaceMesh.tsx      — main component (video + canvas + scores)
    WebcamFaceMesh.css      — component styles
  App.tsx                   — app entry
```

## Contract 2 JSON Shape

```json
{
  "timestamp": 1716500000000,
  "frameRate": 30,
  "detection": {
    "faceDetected": true,
    "poseDetected": true,
    "faceCount": 1
  },
  "scores": {
    "posture": {
      "shoulderTilt": -2.15,
      "shoulderLevelScore": 0.92,
      "forwardLeanScore": 0.85,
      "overallScore": 0.89
    },
    "gaze": {
      "horizontalRatio": 0.48,
      "verticalRatio": 0.52,
      "consistencyScore": 0.91,
      "lookingAtCamera": true
    },
    "composite": 0.90
  },
  "raw": {
    "faceLandmarks": "[[...478 landmarks...]]",
    "poseLandmarks": "[[...33 landmarks...]]"
  }
}
```

## Score Ranges

| Score | Range | Meaning |
|-------|-------|---------|
| Posture Overall | 0.0–1.0 | 60% shoulder level + 40% forward lean |
| Gaze Consistency | 0.0–1.0 | Lower iris movement std dev = higher score |
| Composite | 0.0–1.0 | 50% posture + 50% gaze |

## Phase 1 Roadmap

- [x] Week 1 — Project setup, branch, folder structure
- [x] Week 2 — Live webcam feed
- [x] Week 3 — MediaPipe Face Mesh integration with landmark dots
- [x] Week 4 — MediaPipe Pose alongside Face Mesh
- [x] Week 5 — Posture + gaze scoring, Contract 2 JSON output
- [x] Week 6 — Polish, optimize for 30fps
