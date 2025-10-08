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
    console.log('📹 Intentando iniciar webcam...');
    
    // Verificar si estamos en HTTPS (requerido para cámara en producción)
    if (typeof window !== 'undefined') {
      const isHTTPS = window.location.protocol === 'https:';
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      console.log('🔒 Protocolo:', window.location.protocol);
      console.log('🏠 Hostname:', window.location.hostname);
      
      if (!isHTTPS && !isLocalhost) {
        console.error('❌ HTTPS requerido para acceso a cámara en producción');
        setError('HTTPS es requerido para acceder a la cámara en producción. Asegúrate de que tu sitio use HTTPS.');
        return;
      }
    }
    
    try {
      // Verificar disponibilidad de getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia no está disponible en este navegador');
      }
      
      console.log('🎥 Solicitando permisos de cámara...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      console.log('✅ Webcam activada correctamente');
      console.log('📊 Stream info:', {
        active: stream.active,
        tracks: stream.getVideoTracks().length,
        settings: stream.getVideoTracks()[0]?.getSettings()
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('🔗 Stream asignado al elemento video');
      }
      
      setStream(stream);
      setIsActive(true);
      setError("");
      
    } catch (error: any) {
      console.error('❌ Error iniciando webcam:', error);
      
      // Mensajes de error específicos para producción
      let errorMessage = 'Error desconocido al acceder a la cámara';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permisos de cámara denegados. Por favor, permite el acceso a la cámara y recarga la página.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No se encontró ninguna cámara. Verifica que tu dispositivo tenga una cámara conectada.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Acceso a cámara no soportado. Asegúrate de usar HTTPS en producción.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Cámara en uso por otra aplicación. Cierra otras aplicaciones que puedan estar usando la cámara.';
      } else if (error.message.includes('getUserMedia')) {
        errorMessage = 'Tu navegador no soporta acceso a cámara o necesitas HTTPS para producción.';
      }
      
      console.error('💡 Sugerencias para resolver el error:');
      console.error('   1. Verificar que el sitio use HTTPS en producción');
      console.error('   2. Verificar permisos de cámara en el navegador');
      console.error('   3. Verificar que no haya otras aplicaciones usando la cámara');
      console.error('   4. Probar en un navegador diferente');
      
      setError(errorMessage);
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
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.paused || video.ended) {
      return;
    }

    try {
      const currentTime = Date.now();
      
      // Log para verificar que la función se ejecuta
      console.log('🔍 detectFaces ejecutándose - Seguimiento habilitado:', faceTrackingEnabled);
      
      // Solo detectar rostros si el seguimiento facial está habilitado
      if (faceTrackingEnabled) {
        console.log('👁️ Iniciando detección de rostros...');
        
        // Detectar rostros con máxima precisión para movimientos milimétricos
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({
          inputSize: 512,
          scoreThreshold: 0.2
        }));
        
        console.log('📊 Rostros detectados:', detections.length);
        
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Dibujar líneas de referencia para las zonas de control
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;
          const leftThreshold = videoWidth * 0.4;
          const rightThreshold = videoWidth * 0.6;
          
          // Líneas verticales de zona
          ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          
          // Línea izquierda
          ctx.beginPath();
          ctx.moveTo(leftThreshold, 0);
          ctx.lineTo(leftThreshold, videoHeight);
          ctx.stroke();
          
          // Línea derecha
          ctx.beginPath();
          ctx.moveTo(rightThreshold, 0);
          ctx.lineTo(rightThreshold, videoHeight);
          ctx.stroke();
          
          ctx.setLineDash([]); // Resetear línea punteada
          
          // Solo dibujar rectángulos de detección (sin puntos faciales ni expresiones)
          resizedDetections.forEach((detection, index) => {
            console.log(`🎯 Procesando rostro ${index + 1}:`, detection);
            
            // FaceDetection tiene la propiedad box directamente
            const box = detection.box;
            
            if (box) {
              // Calcular el centro de la detección
              const centerX = box.x + box.width / 2;
              const centerY = box.y + box.height / 2;
              
              console.log(`📍 Centro del rostro ${index + 1}: X=${Math.round(centerX)}, Y=${Math.round(centerY)}`);
              
              // Tamaño fijo del recuadro (80x80 píxeles)
              const fixedSize = 80;
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

              // Mostrar coordenadas en tiempo real
              ctx.fillStyle = '#00ff00';
              ctx.font = '14px Arial';
              ctx.fillText(
                `X: ${Math.round(centerX)} Y: ${Math.round(centerY)}`,
                centerX - halfSize,
                centerY - halfSize - 10
              );
              
              // Mostrar zona actual
              let zona = '';
              if (centerX < leftThreshold) {
                zona = 'IZQUIERDA';
                ctx.fillStyle = '#ff6b6b';
              } else if (centerX > rightThreshold) {
                zona = 'DERECHA';
                ctx.fillStyle = '#4ecdc4';
              } else {
                zona = 'CENTRO';
                ctx.fillStyle = '#45b7d1';
              }
              
              ctx.font = '12px Arial';
              ctx.fillText(
                zona,
                centerX - halfSize,
                centerY + halfSize + 20
              );

              // Control del robot basado en posición del rostro (solo si está habilitado)
              if (onRobotControl) {
                let currentPosition: 'left' | 'right' | 'center';
                
                if (centerX < leftThreshold) {
                  currentPosition = 'left';
                } else if (centerX > rightThreshold) {
                  currentPosition = 'right';
                } else {
                  currentPosition = 'center';
                }
                
                // Solo enviar comando si la posición cambió
                if (currentPosition !== lastFacePositionRef.current) {
                  console.log('👤 Cambio de posición facial detectado:', {
                    anterior: lastFacePositionRef.current,
                    nueva: currentPosition,
                    coordenadas: { x: centerX, y: centerY },
                    umbrales: { izquierda: leftThreshold, derecha: rightThreshold }
                  });
                  
                  lastFacePositionRef.current = currentPosition;
                  
                  if (onRobotControl) {
                    console.log('🚀 Llamando a onRobotControl con:', currentPosition);
                    onRobotControl(currentPosition);
                  } else {
                    console.log('❌ onRobotControl no está definido');
                  }
                }
              }
            }
          });
        }
      } else {
        // Si el seguimiento facial está deshabilitado, limpiar el canvas
        console.log('👁️‍🗨️ Seguimiento facial deshabilitado, limpiando canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    } catch (error) {
      console.error('❌ Error en detectFaces:', error);
    }
  };

  const handleVideoPlay = () => {
    console.log('▶️ Video iniciado, configurando detección facial...');
    console.log('🤖 Modelos cargados:', modelsLoaded);
    console.log('👁️ Seguimiento facial habilitado:', faceTrackingEnabled);
    
    if (!modelsLoaded) {
      console.log('⚠️ Modelos no cargados, no se puede iniciar detección');
      return;
    }
    
    // Esperar a que el video tenga dimensiones válidas
    const video = videoRef.current;
    if (video && (video.videoWidth === 0 || video.videoHeight === 0)) {
      console.log('⏳ Esperando dimensiones del video...');
      setTimeout(handleVideoPlay, 100);
      return;
    }
    
    console.log('✅ Video listo, iniciando bucle de detección');
    
    // Configurar dimensiones del canvas
    const canvas = canvasRef.current;
    if (video && canvas) {
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);
      console.log('📐 Canvas configurado:', displaySize);
    }
    
    // Iniciar bucle de detección continua
    const startDetectionLoop = () => {
      detectFaces();
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        requestAnimationFrame(startDetectionLoop);
      }
    };
    
    startDetectionLoop();
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