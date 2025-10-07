"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

export interface AudioRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  audioBlob: Blob | null;
  duration: number;
}

export interface AudioDevice {
  deviceId: string;
  label: string;
  groupId: string;
}

export interface UseAudioRecordingOptions {
  silenceThreshold?: number; // Umbral de silencio (0-1)
  silenceDuration?: number; // Duración de silencio en ms para auto-envío
  maxRecordingTime?: number; // Tiempo máximo de grabación en ms
  deviceId?: string; // ID del dispositivo de audio específico
}

// Función para obtener dispositivos de audio disponibles
export const getAudioDevices = async (): Promise<AudioDevice[]> => {
  try {
    // Primero solicitar permisos básicos para enumerar dispositivos
    await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices
      .filter(device => device.kind === 'audioinput')
      .map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Micrófono ${device.deviceId.slice(0, 8)}...`,
        groupId: device.groupId
      }));

    console.log('Dispositivos de audio encontrados:', audioInputs);

    // Verificar que cada dispositivo funcione correctamente
    const workingDevices: AudioDevice[] = [];
    
    for (const device of audioInputs) {
      try {
        console.log(`Probando dispositivo: ${device.label} (${device.deviceId})`);
        
        const testStream = await navigator.mediaDevices.getUserMedia({
          audio: { 
            deviceId: { exact: device.deviceId },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        const tracks = testStream.getAudioTracks();
        if (tracks.length > 0 && tracks[0].readyState === 'live') {
          console.log(`✓ Dispositivo ${device.label} funciona correctamente`);
          workingDevices.push({
            ...device,
            label: tracks[0].label || device.label // Usar el label real del track si está disponible
          });
        } else {
          console.warn(`✗ Dispositivo ${device.label} no está disponible`);
        }
        
        // Limpiar el stream de prueba
        testStream.getTracks().forEach(track => track.stop());
        
      } catch (error) {
        console.warn(`✗ Error probando dispositivo ${device.label}:`, error);
      }
    }

    console.log(`Dispositivos funcionales encontrados: ${workingDevices.length}/${audioInputs.length}`);
    return workingDevices;
    
  } catch (error) {
    console.error('Error obteniendo dispositivos de audio:', error);
    throw new Error('No se pudo acceder a los dispositivos de audio. Verifica los permisos del micrófono.');
  }
};

export function useAudioRecording(options: UseAudioRecordingOptions = {}) {
  const {
    silenceThreshold = 0.01,
    silenceDuration = 3000,
    maxRecordingTime = 60000, // 1 minuto máximo
    deviceId, // ID del dispositivo específico
  } = options;

  const [state, setState] = useState<AudioRecordingState>({
    isRecording: false,
    isProcessing: false,
    error: null,
    audioBlob: null,
    duration: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  // Callback para cuando se completa la grabación
  const onRecordingComplete = useRef<((audioBlob: Blob) => void) | null>(null);

  // Función para detectar silencio
  const detectSilence = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calcular el nivel de audio promedio
    const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    const normalizedLevel = average / 255;

    // Actualizar duración
    const currentTime = Date.now();
    const duration = currentTime - startTimeRef.current;
    setState(prev => ({ ...prev, duration }));

    console.log(`Nivel de audio: ${normalizedLevel.toFixed(3)}, Umbral: ${silenceThreshold}, Duración: ${Math.floor(duration / 1000)}s`);

    // Período de gracia inicial de 2 segundos - no detectar silencio inmediatamente
    const gracePeriod = 2000; // 2 segundos
    if (duration < gracePeriod) {
      console.log(`Período de gracia activo (${Math.floor((gracePeriod - duration) / 1000)}s restantes)`);
      // Continuar monitoreando sin detectar silencio
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        animationFrameRef.current = requestAnimationFrame(detectSilence);
      }
      return;
    }

    // Verificar si hay silencio (solo después del período de gracia)
    if (normalizedLevel < silenceThreshold) {
      if (!silenceTimerRef.current) {
        console.log(`Iniciando timer de silencio (${silenceDuration}ms)`);
        silenceTimerRef.current = setTimeout(() => {
          console.log('Silencio detectado, deteniendo grabación');
          stopRecording();
        }, silenceDuration);
      }
    } else {
      // Hay sonido, cancelar el timer de silencio
      if (silenceTimerRef.current) {
        console.log('Sonido detectado, cancelando timer de silencio');
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }

    // Continuar monitoreando solo si estamos grabando
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      animationFrameRef.current = requestAnimationFrame(detectSilence);
    }
  }, [silenceThreshold, silenceDuration]);

  // Función para iniciar la grabación
  const startRecording = useCallback(async (onComplete?: (audioBlob: Blob) => void) => {
    try {
      setState(prev => ({ ...prev, error: null, isProcessing: true }));
      
      console.log('Solicitando permisos del micrófono...');
      
      // Configuración básica de audio
      const audioConstraints = deviceId 
        ? { deviceId: { exact: deviceId } }
        : true;

      console.log('Usando dispositivo:', deviceId || 'predeterminado');

      // Solicitar permisos del micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: audioConstraints
      });
      
      console.log('Permisos concedidos. Stream obtenido:', {
        active: stream.active,
        audioTracks: stream.getAudioTracks().length
      });

      // Verificar que el track de audio esté activo
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack || audioTrack.readyState !== 'live') {
        throw new Error('El micrófono no está disponible o activo');
      }

      console.log('Track de audio:', {
        enabled: audioTrack.enabled,
        readyState: audioTrack.readyState,
        muted: audioTrack.muted
      });

      // Configurar AudioContext para análisis de audio
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Configurar MediaRecorder con formato compatible con Whisper
      let mimeType = 'audio/webm;codecs=opus';
      
      // Verificar formatos soportados y usar el mejor disponible para Whisper
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType
      });

      audioChunksRef.current = [];
      onRecordingComplete.current = onComplete || null;

      // Configurar eventos del MediaRecorder
      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('Datos disponibles:', {
          size: event.data.size,
          type: event.data.type
        });
        
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('Grabación detenida. Chunks:', audioChunksRef.current.length);
        
        if (audioChunksRef.current.length === 0) {
          console.error('No hay chunks de audio disponibles');
          setState(prev => ({ 
            ...prev, 
            error: 'No se pudo capturar audio'
          }));
          return;
        }

        const totalSize = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
        console.log('Tamaño total del audio:', totalSize, 'bytes');

        if (totalSize === 0) {
          console.error('El audio capturado está vacío');
          setState(prev => ({ 
            ...prev, 
            error: 'El audio capturado está vacío'
          }));
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('Blob de audio creado:', {
          size: audioBlob.size,
          type: audioBlob.type
        });

        setState(prev => ({ 
          ...prev, 
          audioBlob, 
          isRecording: false, 
          isProcessing: false 
        }));

        if (onRecordingComplete.current) {
          onRecordingComplete.current(audioBlob);
        }

        // Limpiar recursos
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      // Verificar que el MediaRecorder esté listo
      if (mediaRecorderRef.current.state !== 'inactive') {
        throw new Error(`MediaRecorder no está en estado inactivo: ${mediaRecorderRef.current.state}`);
      }

      // Iniciar grabación con intervalos más frecuentes para capturar datos
      console.log('Iniciando MediaRecorder con formato:', mimeType);
      console.log('Estado del MediaRecorder antes de start:', mediaRecorderRef.current.state);
      
      // Iniciar grabación
      mediaRecorderRef.current.start(1000); // Capturar datos cada segundo
      startTimeRef.current = Date.now();
      
      console.log('MediaRecorder iniciado:', {
        state: mediaRecorderRef.current.state
      });
      
      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        isProcessing: false,
        duration: 0 
      }));

      console.log('Estado actualizado a isRecording: true');

      // Iniciar detección de silencio después de un delay más largo
      setTimeout(() => {
        console.log('Iniciando detección de silencio...');
        // Verificar que aún estemos grabando antes de iniciar detección
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          // Solicitar datos adicionales antes de iniciar detección de silencio
          mediaRecorderRef.current.requestData();
          console.log('Datos solicitados antes de iniciar detección de silencio');
          detectSilence();
        } else {
          console.warn('MediaRecorder no está grabando, no se iniciará detección de silencio');
        }
      }, 2000); // Aumentar delay a 2 segundos para dar más tiempo al MediaRecorder

      // Configurar detección de silencio y timeout
      silenceTimerRef.current = setTimeout(() => {
        console.log('Timeout de silencio alcanzado');
        stopRecording();
      }, 3000); // 3 segundos de silencio

      recordingTimerRef.current = setTimeout(() => {
        console.log('Tiempo máximo de grabación alcanzado');
        stopRecording();
      }, 30000); // 30 segundos máximo

    } catch (error) {
      console.error('Error al iniciar grabación:', {
        error,
        message: error instanceof Error ? error.message : 'Error desconocido',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      let errorMessage = 'Error al acceder al micrófono';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Permisos de micrófono denegados. Por favor, permite el acceso al micrófono.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No se encontró ningún micrófono. Verifica que tengas un micrófono conectado.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'El micrófono está siendo usado por otra aplicación.';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'Las configuraciones del micrófono no son compatibles.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isProcessing: false,
        isRecording: false 
      }));
    }
  }, [detectSilence, maxRecordingTime]);

  // Función para detener la grabación
  const stopRecording = useCallback(() => {
    console.log('stopRecording llamado, estado actual:', {
      isRecording: state.isRecording,
      mediaRecorderState: mediaRecorderRef.current?.state,
      chunksCollected: audioChunksRef.current.length,
      recordingDuration: startTimeRef.current ? Date.now() - startTimeRef.current : 0
    });

    // Evitar múltiples llamadas - solo proceder si realmente estamos grabando
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
      console.log('MediaRecorder no está grabando, estado actual:', mediaRecorderRef.current?.state, '- ignorando llamada a stopRecording');
      return;
    }

    console.log('Deteniendo MediaRecorder... Chunks recolectados hasta ahora:', audioChunksRef.current.length);
    
    // Forzar la recolección de datos finales antes de detener
    if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.requestData();
      console.log('Datos finales solicitados antes de detener');
    }
    
    mediaRecorderRef.current.stop();

    // Actualizar estado inmediatamente para evitar múltiples llamadas
    setState(prev => ({ ...prev, isRecording: false }));
    
    console.log('Estado actualizado a isRecording: false, esperando evento onstop...');

    // Limpiar timers
    if (silenceTimerRef.current) {
      console.log('Limpiando timer de silencio');
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recordingTimerRef.current) {
      console.log('Limpiando timer de grabación');
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (animationFrameRef.current) {
      console.log('Cancelando animationFrame');
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [state.isRecording]);

  // Función para cancelar la grabación
  const cancelRecording = useCallback(() => {
    console.log('cancelRecording llamado');
    
    // Limpiar recursos inmediatamente sin procesar el audio
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      // Limpiar el callback para evitar procesamiento
      onRecordingComplete.current = null;
      mediaRecorderRef.current.stop();
    }
    
    // Limpiar timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Limpiar chunks
    audioChunksRef.current = [];
    
    setState(prev => ({ 
      ...prev, 
      isRecording: false, 
      isProcessing: false,
      audioBlob: null,
      duration: 0,
      error: null
    }));
    
    console.log('Grabación cancelada y recursos limpiados');
  }, []);

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      cancelRecording();
    };
  }, [cancelRecording]);

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}