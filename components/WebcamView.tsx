"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from 'face-api.js';
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, X } from "lucide-react";

interface WebcamViewProps {
  show: boolean;
  onHide: () => void;
  className?: string;
}

export default function WebcamView({ show, onHide, className = "" }: WebcamViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        // Solo cargar el modelo TinyFaceDetector para detección básica de rostros
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        
        setModelsLoaded(true);
      } catch (error) {
        setModelsLoaded(false);
      }
    };
    
    // Agregar un pequeño delay para asegurar que el DOM esté listo
    setTimeout(loadModels, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

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
          setError("No se pudo acceder a la cámara. Verifica los permisos.");
        }
  };

  const stopWebcam = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  };

  const handleVideoPlay = () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Esperar a que el video tenga dimensiones válidas
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setTimeout(handleVideoPlay, 100);
      return;
    }

    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    let lastDetectionTime = 0;
    let lastDetections: any[] = [];

    const detectFaces = async () => {
      if (video.paused || video.ended) {
        return;
      }

      try {
        const currentTime = Date.now();
        
        // Detectar rostros cada milisegundo pero solo actualizar canvas si hay cambios
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
        
        // Solo actualizar canvas si han pasado al menos 16ms (60fps) o si cambió el número de rostros
        const shouldUpdate = currentTime - lastDetectionTime > 16 || detections.length !== lastDetections.length;
        
        if (shouldUpdate) {
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Solo dibujar rectángulos de detección (sin puntos faciales ni expresiones)
            resizedDetections.forEach(detection => {
              // FaceDetection tiene la propiedad box directamente
              const box = detection.box;
              
              if (box) {
                // Calcular el centro de la detección
                const centerX = box.x + box.width / 2;
                const centerY = box.y + box.height / 2;
                
                // Tamaño fijo del recuadro (150x150 píxeles)
                const fixedSize = 150;
                const halfSize = fixedSize / 2;
                
                // Dibujar recuadro de tamaño fijo centrado en la detección
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.strokeRect(
                  centerX - halfSize, 
                  centerY - halfSize, 
                  fixedSize, 
                  fixedSize
                );
              }
            });
          }
          
          lastDetectionTime = currentTime;
          lastDetections = detections;
        }
      } catch (error) {
        // Error silencioso durante detección
      }
    };

    // Usar requestAnimationFrame para mejor rendimiento
    const animationLoop = () => {
      detectFaces();
      if (!video.paused && !video.ended) {
        requestAnimationFrame(animationLoop);
      }
    };

    animationLoop();
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
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
              onPlay={handleVideoPlay}
            />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
            
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