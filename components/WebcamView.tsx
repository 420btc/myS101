"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, X } from "lucide-react";

interface WebcamViewProps {
  show: boolean;
  onHide: () => void;
  className?: string;
}

export default function WebcamView({ show, onHide, className = "" }: WebcamViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");
  const [isMinimized, setIsMinimized] = useState(false);

  const startWebcam = async () => {
    try {
      setError("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: "user"
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsActive(true);
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setError("No se pudo acceder a la cámara. Verifica los permisos.");
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  };

  const toggleWebcam = () => {
    if (isActive) {
      stopWebcam();
    } else {
      startWebcam();
    }
  };

  const closeWebcam = () => {
    stopWebcam();
    onHide();
  };

  useEffect(() => {
    if (show && !isActive) {
      startWebcam();
    } else if (!show && isActive) {
      stopWebcam();
    }
  }, [show]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  if (!show) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-[9999] ${className}`}>
      <div className={`bg-black rounded-lg shadow-2xl border-2 border-gray-600 overflow-hidden transition-all duration-300 ${
        isMinimized ? 'w-20 h-16' : 'w-80 h-60'
      }`}>
        {/* Header con controles */}
        <div className="bg-gray-800 px-2 py-1 flex justify-between items-center">
          <span className="text-white text-xs font-medium">
            {isMinimized ? "📹" : "Webcam"}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-gray-400 hover:text-white text-xs p-1"
            >
              {isMinimized ? "□" : "−"}
            </button>
            <button
              onClick={closeWebcam}
              className="text-gray-400 hover:text-red-400 p-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Video container */}
        {!isMinimized && (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-56 object-cover"
            />
            
            {error && (
              <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center p-2">
                <p className="text-white text-xs text-center">{error}</p>
              </div>
            )}

            {/* Control overlay */}
            <div className="absolute bottom-2 left-2 right-2 flex justify-center">
              <Button
                onClick={toggleWebcam}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2"
                size="sm"
              >
                <CameraOff className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}