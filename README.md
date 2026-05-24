# CV Interview Coach — Computer Vision Module

Real-time facial landmark detection for interview coaching, built with React + TypeScript + Vite + MediaPipe.

## Features

- **Live webcam feed** via `getUserMedia`
- **MediaPipe Face Mesh** (FaceLandmarker) — 478 facial landmarks rendered as dots on a canvas overlay
- **Real-time FPS counter** and face count display
- **Start/Stop toggle** for detection
- Mirror-mode video (selfie view)
- Supports up to 2 faces simultaneously

## Tech Stack

- React 19 + TypeScript
- Vite 8
- `@mediapipe/tasks-vision` (FaceLandmarker)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and allow camera access when prompted.

## Project Structure

```
src/
  hooks/
    useWebcam.ts          — webcam stream management
    useFaceLandmarker.ts  — MediaPipe FaceLandmarker initialization
  components/
    WebcamFaceMesh.tsx    — main component (video + canvas overlay + controls)
    WebcamFaceMesh.css    — component styles
  App.tsx                 — app entry
```

## Phase 1 Roadmap

- [x] Week 1 — Project setup, branch, folder structure
- [x] Week 2 — Live webcam feed
- [x] Week 3 — MediaPipe Face Mesh integration with landmark dots
- [ ] Week 4 — Add MediaPipe Pose alongside Face Mesh
- [ ] Week 5 — Posture + gaze scoring, Contract 2 JSON output
- [ ] Week 6 — Demo, polish, 30fps target
