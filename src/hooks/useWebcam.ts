import { useCallback, useEffect, useRef, useState } from "react";

export interface WebcamState {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  error: string | null;
  isReady: boolean;
  retry: () => void;
}

export function useWebcam(): WebcamState {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);

  const retry = useCallback(() => {
    setError(null);
    setIsReady(false);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
    setAttempt((a) => a + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" },
          audio: false,
        });

        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadeddata = () => {
            if (!cancelled) setIsReady(true);
          };
        }
      } catch (err) {
        if (!cancelled) {
          let msg = "Failed to access webcam";
          if (err instanceof DOMException) {
            switch (err.name) {
              case "NotFoundError":
                msg = "No camera found. Please connect a webcam and try again.";
                break;
              case "NotAllowedError":
                msg =
                  "Camera access denied. Please allow camera access in your browser settings and try again.";
                break;
              case "NotReadableError":
                msg =
                  "Camera is in use by another application. Close it and try again.";
                break;
              default:
                msg = `Camera error: ${err.message}`;
            }
          } else if (err instanceof Error) {
            msg = err.message;
          }
          setError(msg);
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [attempt]);

  return { videoRef, stream, error, isReady, retry };
}
