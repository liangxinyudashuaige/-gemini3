import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { InteractionRef } from '../types';

interface HandTrackerProps {
  interactionRef: InteractionRef;
}

const HandTracker: React.FC<HandTrackerProps> = ({ interactionRef }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;
    let lastVideoTime = -1;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });

        startWebcam();
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
      }
    };

    const startWebcam = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: 1280,
              height: 720
            }
          });
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', predictWebcam);
          setLoading(false);
        } catch (err) {
          console.error("Webcam access denied", err);
        }
      }
    };

    const predictWebcam = () => {
      if (!videoRef.current || !canvasRef.current || !handLandmarker) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Resize canvas to match video
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Detect hands
      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const results = handLandmarker.detectForVideo(video, performance.now());

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Reset interaction state before updating
        let newLeftHand = { present: false, x: 0.5, y: 0.5, pinching: false, pinchDistance: 0 };
        let newRightHand = { present: false, x: 0.5, y: 0.5, pinching: false, screenX: 0, screenY: 0 };

        if (results.landmarks) {
          for (let i = 0; i < results.landmarks.length; i++) {
            const landmarks = results.landmarks[i];
            const handedness = results.handedness[i][0].categoryName; // "Left" or "Right"
            
            // Draw Skeleton
            drawHolographicSkeleton(ctx, landmarks);

            // Analysis for Interaction
            // Palm Center (approximate using wrist 0, index 5, pinky 17)
            const palmX = (landmarks[0].x + landmarks[5].x + landmarks[17].x) / 3;
            const palmY = (landmarks[0].y + landmarks[5].y + landmarks[17].y) / 3;

            // Pinch Detection (Thumb Tip 4 vs Index Tip 8)
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const distance = Math.sqrt(
              Math.pow(thumbTip.x - indexTip.x, 2) + 
              Math.pow(thumbTip.y - indexTip.y, 2)
            );
            const isPinching = distance < 0.05; // Threshold

            // Update State Refs
            if (handedness === 'Right') { // User's Right Hand (for panel drag)
                newRightHand = {
                    present: true,
                    x: 1 - palmX, // Mirror X for interaction intuition
                    y: palmY,
                    pinching: isPinching,
                    screenX: (1 - palmX) * window.innerWidth,
                    screenY: palmY * window.innerHeight
                };
            } else { // User's Left Hand (for Earth control)
                newLeftHand = {
                    present: true,
                    x: 1 - palmX, 
                    y: palmY,
                    pinching: isPinching,
                    pinchDistance: distance
                };
            }
          }
        }

        // Atomically update ref
        interactionRef.current = {
            leftHand: newLeftHand.present ? newLeftHand : interactionRef.current.leftHand,
            rightHand: newRightHand.present ? newRightHand : interactionRef.current.rightHand
        };
        
        // Decay presence if not detected (optional smoothing, omitting for simplicity)
        if (!newLeftHand.present) interactionRef.current.leftHand.present = false;
        if (!newRightHand.present) interactionRef.current.rightHand.present = false;

      }
      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    setupMediaPipe();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [interactionRef]);

  // Helper to draw cool sci-fi skeleton
  const drawHolographicSkeleton = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    const drawingUtils = new DrawingUtils(ctx);
    
    // Connectors
    drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
      color: "#00FFFF",
      lineWidth: 2
    });
    
    // Landmarks (Joints)
    for (const landmark of landmarks) {
        ctx.beginPath();
        ctx.arc(landmark.x * ctx.canvas.width, landmark.y * ctx.canvas.height, 4, 0, 2 * Math.PI);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00FFFF";
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
  };

  return (
    <>
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover -scale-x-100 opacity-60 mix-blend-luminosity brightness-150 contrast-125 pointer-events-none"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full object-cover -scale-x-100 pointer-events-none z-10"
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 text-cyan-400 font-mono animate-pulse">
          {'>>'} INITIALIZING SENSORS...
        </div>
      )}
    </>
  );
};

export default HandTracker;