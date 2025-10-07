"use client";

import OpenAI from 'openai';
import { getApiKeyFromLocalStorage } from './chatSettings';

// Configuración de OpenAI - se creará dinámicamente con la API key del usuario

export interface WhisperTranscriptionOptions {
  language?: string; // Idioma del audio (opcional, se detecta automáticamente)
  prompt?: string; // Contexto adicional para mejorar la transcripción
  temperature?: number; // Creatividad en la transcripción (0-1)
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

export interface WhisperTranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
  }>;
}

/**
 * Convierte un Blob de audio a un archivo File para la API de Whisper
 */
function blobToFile(blob: Blob, filename?: string): File {
  // Determinar la extensión basada en el tipo MIME
  let extension = 'webm'; // fallback
  let finalFilename = filename;
  
  if (blob.type.includes('wav')) {
    extension = 'wav';
  } else if (blob.type.includes('mp4')) {
    extension = 'mp4';
  } else if (blob.type.includes('ogg')) {
    extension = 'ogg';
  } else if (blob.type.includes('webm')) {
    extension = 'webm';
  }
  
  // Si no se proporciona filename, crear uno con la extensión correcta
  if (!finalFilename) {
    finalFilename = `audio.${extension}`;
  }
  
  return new File([blob], finalFilename, { type: blob.type });
}

/**
 * Transcribe audio usando la API de Whisper de OpenAI
 */
export async function transcribeAudio(
  audioBlob: Blob,
  options: WhisperTranscriptionOptions = {}
): Promise<WhisperTranscriptionResult> {
  try {
    // Verificar que tenemos una API key desde localStorage
    const apiKey = getApiKeyFromLocalStorage();
    console.log('API Key obtenida:', apiKey ? `${apiKey.substring(0, 10)}...` : 'No encontrada');
    
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key de OpenAI no configurada. Por favor, configúrala en el modal de configuración.');
    }

    // Crear instancia de OpenAI con la API key del localStorage
    const openai = new OpenAI({
      apiKey: apiKey.trim(),
      dangerouslyAllowBrowser: true,
    });

    // Convertir el blob a archivo
    const audioFile = blobToFile(audioBlob);

    console.log('Archivo de audio creado:', {
      size: audioFile.size,
      type: audioFile.type,
      name: audioFile.name,
      lastModified: audioFile.lastModified
    });

    // Verificar que el archivo tiene contenido
    if (audioFile.size === 0) {
      console.error('Error: Archivo de audio vacío');
      throw new Error('El archivo de audio está vacío. Intenta grabar de nuevo.');
    }

    // Verificar tamaño mínimo (al menos 1KB)
    if (audioFile.size < 1024) {
      console.error('Error: Archivo de audio demasiado pequeño:', audioFile.size, 'bytes');
      throw new Error('El archivo de audio es demasiado pequeño. Intenta grabar por más tiempo.');
    }

    // Verificar que el tipo MIME es válido
    const validMimeTypes = ['audio/wav', 'audio/mp4', 'audio/ogg', 'audio/webm', 'audio/mpeg'];
    if (!validMimeTypes.some(type => audioFile.type.includes(type))) {
      console.error('Error: Tipo de archivo no válido:', audioFile.type);
      throw new Error(`Formato de audio no soportado: ${audioFile.type}`);
    }

    // Configurar opciones por defecto
    const transcriptionOptions = {
      model: 'whisper-1',
      language: options.language || 'es', // Español por defecto
      prompt: options.prompt || 'Transcripción de comandos para robot',
      temperature: options.temperature || 0,
      response_format: options.response_format || 'verbose_json' as const,
    };

    console.log('Iniciando transcripción con Whisper...', {
      fileSize: audioFile.size,
      fileType: audioFile.type,
      fileName: audioFile.name,
      apiKeyPresent: !!apiKey,
      options: transcriptionOptions
    });

    // Realizar la transcripción
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      ...transcriptionOptions,
    });

    console.log('Transcripción completada:', transcription);

    // Procesar la respuesta según el formato
    if (options.response_format === 'verbose_json') {
      // Para verbose_json, la respuesta incluye propiedades adicionales
      const verboseTranscription = transcription as any;
      return {
        text: transcription.text,
        language: verboseTranscription.language || undefined,
        duration: verboseTranscription.duration || undefined,
        segments: verboseTranscription.segments || undefined,
      };
    } else {
      return {
        text: typeof transcription === 'string' ? transcription : transcription.text,
      };
    }

  } catch (error) {
    console.error('Error en transcripción de Whisper:', error);
    
    // Manejar errores específicos
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Error de autenticación con OpenAI. Verifica tu API key.');
      } else if (error.message.includes('quota')) {
        throw new Error('Límite de cuota de OpenAI excedido.');
      } else if (error.message.includes('network')) {
        throw new Error('Error de conexión. Verifica tu conexión a internet.');
      }
    }
    
    throw new Error('Error al transcribir el audio. Inténtalo de nuevo.');
  }
}

/**
 * Verifica si la API de Whisper está disponible
 */
export function isWhisperAvailable(): boolean {
  // Verificar si estamos en el navegador y si hay API key en localStorage
  if (typeof window === 'undefined') return false;
  const apiKey = getApiKeyFromLocalStorage();
  return !!apiKey && apiKey.trim().length > 0;
}

/**
 * Obtiene los idiomas soportados por Whisper
 */
export function getSupportedLanguages(): Array<{ code: string; name: string }> {
  return [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'zh', name: '中文' },
    // Whisper soporta muchos más idiomas, estos son los más comunes
  ];
}

/**
 * Estima el costo de transcripción basado en la duración del audio
 */
export function estimateTranscriptionCost(durationSeconds: number): number {
  // Precio de Whisper: $0.006 por minuto
  const pricePerMinute = 0.006;
  const durationMinutes = durationSeconds / 60;
  return Math.ceil(durationMinutes * pricePerMinute * 100) / 100; // Redondear a 2 decimales
}