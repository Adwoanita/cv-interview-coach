import { useEffect, useRef, useState } from "react";
import {
  PoseLandmarker,
  FilesetResolver,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

export interface PoseLandmarkerState {
  landmarker: PoseLandmarker | null;
  isLoading: boolean;
  error: string | null;
}

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export function usePoseLandmarker(): PoseLandmarkerState {
  const [landmarker, setLandmarker] = useState<PoseLandmarker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const closerRef = useRef<PoseLandmarker | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });

        if (cancelled) {
          poseLandmarker.close();
          return;
        }

        closerRef.current = poseLandmarker;
        setLandmarker(poseLandmarker);
        setIsLoading(false);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof Error
              ? err.message
              : "Failed to load Pose Landmarker model";
          setError(msg);
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      closerRef.current?.close();
    };
  }, []);

  return { landmarker, isLoading, error };
}

export type { PoseLandmarkerResult };
