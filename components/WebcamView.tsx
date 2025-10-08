"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from 'face-api.js';
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, X, Eye, EyeOff } from "lucide-react";

interface WebcamViewProps {
  show: boolean;
  onHide: () => void;
  className?: string;
  onRobotControl?: (direction: 'left' | 'right' | 'center') => void;
}

export default function WebcamView({ show, onHide, className = "", onRobotControl }: WebcamViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceTrackingEnabled, setFaceTrackingEnabled] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFacePositionRef = useRef<'left' | 'right' | 'center'>('center');

  useEffect(() => {
    const loadModels = async () => {
      try {
        // Intentar múltiples rutas para compatibilidad con producción
        const modelPaths = [
          '/models',           // Ruta local de desarrollo
          './models',          // Ruta relativa
          '/public/models',    // Ruta alternativa
          'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model' // CDN de respaldo
        ];
        
        let modelsLoadedSuccessfully = false;
        let lastError = null;
        
        for (const modelPath of modelPaths) {
          try {
            // Solo cargar el modelo TinyFaceDetector para detección básica de rostros
            await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
            
            modelsLoadedSuccessfully = true;
            break;
          } catch (pathError) {
            lastError = pathError;
            continue;
          }
        }
        
        if (modelsLoadedSuccessfully) {
          setModelsLoaded(true);
        } else {
          throw lastError || new Error('No se pudieron cargar los modelos desde ninguna ruta');
        }
        
      } catch (error) {
        setModelsLoaded(false);
        setError('Error cargando modelos de detección facial. Revisa la consola para más detalles.');
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
      // Verificar si estamos en un contexto seguro (HTTPS o localhost)
      const isSecureContext = window.location.protocol === 'https:' || 
                             window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1';
      
      if (!isSecureContext && window.location.protocol !== 'http:') {
        throw new Error('HTTPS_REQUIRED');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setStream(stream);
      setIsActive(true);
      setError("");
    } catch (err: any) {
      let errorMessage = 'Error accediendo a la cámara';
      let suggestions: string[] = [];
      
      if (err.name === 'NotAllowedError' || err.message === 'Permission denied') {
        errorMessage = 'Permisos de cámara denegados';
        suggestions = [
          '1. Haz clic en el ícono de cámara en la barra de direcciones',
          '2. Selecciona "Permitir" para el acceso a la cámara',
          '3. Recarga la página después de otorgar permisos'
        ];
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No se encontró ninguna cámara';
        suggestions = [
          '1. Conecta una cámara web al dispositivo',
          '2. Verifica que la cámara esté funcionando en otras aplicaciones',
          '3. Reinicia el navegador'
        ];
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Cámara en uso por otra aplicación';
        suggestions = [
          '1. Cierra otras aplicaciones que usen la cámara',
          '2. Reinicia el navegador',
          '3. Reinicia el dispositivo si es necesario'
        ];
      } else if (err.message === 'HTTPS_REQUIRED') {
        errorMessage = 'Se requiere conexión segura (HTTPS)';
        suggestions = [
          '1. Accede al sitio usando HTTPS',
          '2. O usa localhost para desarrollo',
          '3. Configura certificados SSL en producción'
        ];
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Navegador no compatible';
        suggestions = [
          '1. Usa Chrome, Firefox, Safari o Edge moderno',
          '2. Actualiza tu navegador a la última versión',
          '3. Verifica que WebRTC esté habilitado'
        ];
      }

      setError(`${errorMessage}. ${suggestions.join(' ')}`);
      setIsActive(false);
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

  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!faceTrackingEnabled) {
      return;
    }

    try {
      // Detectar rostros usando TinyFaceDetector
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());

      if (detections && detections.length > 0) {
        detections.forEach((detection, index) => {
          const { x, y, width, height } = detection.box;
          
          // Calcular el centro del rostro
          const centerX = x + width / 2;
          const centerY = y + height / 2;

          // Dibujar rectángulo alrededor del rostro
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);

          // Dibujar punto central
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
          ctx.fill();

          // Mostrar coordenadas
          ctx.fillStyle = '#00ff00';
          ctx.font = '16px Arial';
          ctx.fillText(`X: ${Math.round(centerX)}, Y: ${Math.round(centerY)}`, x, y - 10);

          // Determinar zona y enviar comando al robot
          let zone = 'CENTRO';
          if (centerX < canvas.width * 0.4) {
            zone = 'IZQUIERDA';
            if (onRobotControl) onRobotControl('left');
          } else if (centerX > canvas.width * 0.6) {
            zone = 'DERECHA';
            if (onRobotControl) onRobotControl('right');
          } else {
            if (onRobotControl) onRobotControl('center');
          }

          // Mostrar zona
          ctx.fillText(`Zona: ${zone}`, x, y + height + 20);
        });
      }
    } catch (error) {
      console.error('Error en detectFaces:', error);
    }
  };

  const handleVideoPlay = () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Configurar el canvas para que coincida con el video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Iniciar el bucle de detección continua
    const detectLoop = () => {
      detectFaces();
      requestAnimationFrame(detectLoop);
    };

    detectLoop();
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
            <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-2">
              <Button
                onClick={() => setFaceTrackingEnabled(!faceTrackingEnabled)}
                className={`${faceTrackingEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'} text-white rounded-full p-2`}
                size="sm"
                title={faceTrackingEnabled ? "Desactivar seguimiento facial" : "Activar seguimiento facial"}
              >
                {faceTrackingEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
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