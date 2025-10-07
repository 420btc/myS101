"use client";
import React, { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import { generateText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { SettingsModal } from "./SettingsModal";
import { MicrophoneSelector } from "./MicrophoneSelector";
import { z } from "zod";
import {
  getApiKeyFromLocalStorage,
  getBaseURLFromLocalStorage,
  getSystemPromptFromLocalStorage,
  getModelFromLocalStorage,
} from "../../../lib/chatSettings";
import useMeasure from "react-use-measure";
import { panelStyle } from "@/components/playground/panelStyle";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { transcribeAudio, isWhisperAvailable } from "@/lib/whisper";
import { RiMicLine, RiMicOffLine, RiLoader4Line } from "@remixicon/react";

type ChatControlProps = {
  robotName?: string;
  systemPrompt?: string;
  onHide: () => void;
  show?: boolean; // 新增 show 属性
};

export function ChatControl({
  robotName,
  systemPrompt: configSystemPrompt,
  onHide,
  show = true,
}: ChatControlProps) {
  const [ref, bounds] = useMeasure();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>(
    []
  );
  const [showSettings, setShowSettings] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);

  // Audio recording state
  const audioRecording = useAudioRecording({
    silenceThreshold: 0.01,
    silenceDuration: 3000,
    maxRecordingTime: 60000,
    deviceId: selectedDeviceId,
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const apiKey = getApiKeyFromLocalStorage();
  const baseURL = getBaseURLFromLocalStorage() || "https://api.openai.com/v1/";
  const model = getModelFromLocalStorage() || "gpt-4.1-nano";
  const systemPrompt =
    getSystemPromptFromLocalStorage(robotName) ||
    configSystemPrompt || // <-- Use configSystemPrompt if present
    `Eres un asistente para controlar un brazo robótico so-arm100 mediante teclas específicas.

REGLA CRÍTICA: NUNCA uses múltiples herramientas keyPress en una sola respuesta. 

HERRAMIENTAS:
1. keyPress: SOLO para UNA acción individual
2. keySequence: OBLIGATORIO para 2 o más acciones

INSTRUCCIONES ESTRICTAS:
- Si detectas palabras como "y", "luego", "después", "primero", "segundo" → USA keySequence
- Si hay múltiples movimientos de articulaciones → USA keySequence
- Si hay múltiples direcciones → USA keySequence

MAPEO DE TECLAS CORRECTO PARA SO-ARM100:
- "q"/"1": Rotación base (izquierda/derecha)
- "w"/"2": Pitch (arriba/abajo del hombro)
- "e"/"3": Codo (flexión/extensión)
- "r"/"4": Muñeca pitch (arriba/abajo de muñeca)
- "t"/"5": Muñeca roll (rotación de muñeca)
- "y"/"6": Garra (abrir/cerrar)

EJEMPLOS CORRECTOS:
❌ INCORRECTO: Usar keyPress("q") + keyPress("w") + keyPress("e")
✅ CORRECTO: keySequence([{key:"q", duration:1000, pauseAfter:500}, {key:"w", duration:1000, pauseAfter:500}, {key:"e", duration:1000, pauseAfter:0}])

INTERPRETACIÓN DE COMANDOS:
- "derecha" → "q" (rotación base derecha)
- "izquierda" → "1" (rotación base izquierda)  
- "arriba" → "w" (pitch arriba)
- "abajo" → "2" (pitch abajo)

Duración por defecto: 1000ms. Pausa entre acciones: 500ms.`;

  // Create openai instance with current apiKey and baseURL
  const openai = createOpenAI({
    apiKey,
    baseURL,
  });

  useEffect(() => {
    if (bounds.height > 0) {
      setPosition((pos) => ({
        ...pos,
        x: window.innerWidth - bounds.width - 20,
        y: 70,
      }));
    }
  }, [bounds.height]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleCommand = async (command: string) => {
    console.log(`[ChatControl] Procesando comando: "${command}"`);
    setMessages((prev) => [...prev, { sender: "Usuario", text: command }]);
    
    try {
      console.log(`[ChatControl] Llamando a generateText...`);
      const result = await generateText({
        model: openai(model),
        prompt: command,
        system: systemPrompt,
        tools: {
          keyPress: tool({
            description:
              "Presiona y mantén una tecla del teclado durante una duración específica (en milisegundos) para controlar el robot",
            parameters: z.object({
              key: z
                .string()
                .describe(
                  "La tecla a presionar (ej: 'w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight')"
                ),
              duration: z
                .number()
                .int()
                .min(100)
                .default(1000)
                .describe(
                  "Cuánto tiempo mantener la tecla en milisegundos (por defecto: 1000, mín: 100, sin límite máximo para rotación continua)"
                ),
            }),
            execute: async ({
              key,
              duration,
            }: {
              key: string;
              duration?: number;
            }) => {
              const holdTime = duration ?? 1000;
              console.log(`[AI KeyPress] Ejecutando tecla: ${key}, duración: ${holdTime}ms`);
              
              // Cancelar cualquier evento previo de la misma tecla
              const existingKeyupEvent = new KeyboardEvent("keyup", {
                key,
                bubbles: true,
                cancelable: true,
              });
              document.dispatchEvent(existingKeyupEvent);
              
              // Pequeña pausa antes del keydown
              await new Promise((resolve) => setTimeout(resolve, 10));
              
              const keydownEvent = new KeyboardEvent("keydown", {
                key,
                bubbles: true,
                cancelable: true,
              });
              console.log(`[AI KeyPress] Enviando keydown para: ${key}`);
              document.dispatchEvent(keydownEvent);

              // Wait for the specified duration
              await new Promise((resolve) => setTimeout(resolve, holdTime));

              // Simulate keyup event
              const keyupEvent = new KeyboardEvent("keyup", {
                key,
                bubbles: true,
                cancelable: true,
              });
              console.log(`[AI KeyPress] Enviando keyup para: ${key}`);
              document.dispatchEvent(keyupEvent);
              
              console.log(`[AI KeyPress] Completado: ${key} durante ${holdTime}ms`);
              return `Tecla "${key.toUpperCase()}" mantenida durante ${holdTime} ms`;
            },
          }),
          keySequence: tool({
            description:
              "Ejecuta una secuencia de múltiples pulsaciones de teclas con duraciones específicas para movimientos complejos",
            parameters: z.object({
              sequence: z
                .array(
                  z.object({
                    key: z
                      .string()
                      .describe(
                        "La tecla a presionar (ej: 'w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight')"
                      ),
                    duration: z
                      .number()
                      .int()
                      .min(100)
                      .describe(
                        "Cuánto tiempo mantener la tecla en milisegundos (mín: 100, sin límite máximo para rotación continua)"
                      ),
                    pauseAfter: z
                      .number()
                      .int()
                      .min(0)
                      .max(5000)
                      .default(100)
                      .describe(
                        "Pausa después de esta tecla en milisegundos (por defecto: 100, máx: 5000)"
                      ),
                  })
                )
                .min(1)
                .max(10)
                .describe(
                  "Secuencia de teclas a ejecutar (máximo 10 teclas por secuencia)"
                ),
            }),
            execute: async ({
              sequence,
            }: {
              sequence: Array<{
                key: string;
                duration: number;
                pauseAfter?: number;
              }>;
            }) => {
              console.log(`[AI KeySequence] Iniciando secuencia de ${sequence.length} teclas`);
              let results: string[] = [];
              
              for (let i = 0; i < sequence.length; i++) {
                const { key, duration, pauseAfter = 100 } = sequence[i];
                
                console.log(`[AI KeySequence] Paso ${i + 1}/${sequence.length}: ${key} por ${duration}ms`);
                
                // Execute keypress
                const keydownEvent = new KeyboardEvent("keydown", {
                  key,
                  bubbles: true,
                  cancelable: true,
                });
                console.log(`[AI KeySequence] Enviando keydown para: ${key}`);
                
                // Cancelar cualquier evento previo de la misma tecla
                const existingKeyupEvent = new KeyboardEvent("keyup", {
                  key,
                  bubbles: true,
                  cancelable: true,
                });
                document.dispatchEvent(existingKeyupEvent);
                
                // Pequeña pausa antes del keydown
                await new Promise((resolve) => setTimeout(resolve, 10));
                
                document.dispatchEvent(keydownEvent);

                // Wait for the specified duration
                await new Promise((resolve) => setTimeout(resolve, duration));

                // Simulate keyup event
                const keyupEvent = new KeyboardEvent("keyup", {
                  key,
                  bubbles: true,
                  cancelable: true,
                });
                console.log(`[AI KeySequence] Enviando keyup para: ${key}`);
                document.dispatchEvent(keyupEvent);
                
                results.push(`${i + 1}. Tecla "${key.toUpperCase()}" mantenida durante ${duration} ms`);
                
                // Pause between keystrokes (except for the last one)
                if (i < sequence.length - 1 && pauseAfter > 0) {
                  console.log(`[AI KeySequence] Pausa de ${pauseAfter}ms antes del siguiente paso`);
                  await new Promise((resolve) => setTimeout(resolve, pauseAfter));
                } else if (i < sequence.length - 1) {
                  // Pausa mínima entre teclas para evitar conflictos
                  console.log(`[AI KeySequence] Pausa mínima de 50ms antes del siguiente paso`);
                  await new Promise((resolve) => setTimeout(resolve, 50));
                }
              }
              
              console.log(`[AI KeySequence] Secuencia completada exitosamente`);
              return `Secuencia ejecutada:\n${results.join('\n')}`;
            },
          }),
        },
      });
      
      console.log(`[ChatControl] generateText completado. Procesando respuesta...`);
      let text = result.text.trim();
      const content = result.response?.messages[1]?.content;
      
      console.log(`[ChatControl] Contenido de respuesta:`, content);
      
      for (const element of content ?? []) {
        if (typeof element === 'object' && element !== null && 'result' in element) {
          console.log(`[ChatControl] Agregando resultado de herramienta:`, element.result);
          text += `\n\n${element.result}`;
        } else if (typeof element === 'string') {
          console.log(`[ChatControl] Agregando texto:`, element);
          text += `\n\n${element}`;
        }
      }
      
      console.log(`[ChatControl] Respuesta final procesada:`, text);
      setMessages((prev) => [...prev, { sender: "IA", text }]);
    } catch (error) {
      console.error("[ChatControl] Error generating text:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "IA", text: "Error: No se pudo procesar tu solicitud." },
      ]);
    }
  };

  const handleSend = () => {
    if (input.trim()) {
      if (!apiKey) {
        setShowSettings(true);
        return;
      }
      handleCommand(input.trim());
      setInput(""); // Clear input after sending
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  // Handle audio transcription and sending
  const handleAudioTranscription = async (audioBlob: Blob) => {
    try {
      setMessages((prev) => [...prev, { sender: "Sistema", text: "Transcribiendo audio..." }]);
      
      const transcription = await transcribeAudio(audioBlob, {
        language: 'es',
        prompt: 'Comandos para controlar un robot',
      });

      if (transcription.text.trim()) {
        // Remove the "transcribing" message and add the transcribed text
        setMessages((prev) => prev.slice(0, -1));
        handleCommand(transcription.text.trim());
      } else {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { sender: "Sistema", text: "No se detectó audio claro. Inténtalo de nuevo." }
        ]);
      }
    } catch (error) {
      console.error('Error en transcripción:', error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { sender: "Sistema", text: `Error en transcripción: ${error instanceof Error ? error.message : 'Error desconocido'}` }
      ]);
    }
  };

  // Handle microphone button click
  const handleMicrophoneClick = () => {
    if (!isWhisperAvailable()) {
      setMessages((prev) => [
        ...prev,
        { sender: "Sistema", text: "Whisper no está disponible. Configura tu API key de OpenAI." }
      ]);
      setShowSettings(true);
      return;
    }

    if (audioRecording.isRecording) {
      audioRecording.stopRecording();
    } else {
      audioRecording.startRecording(handleAudioTranscription);
    }
  };

  return (
    <Rnd
      position={position}
      onDragStop={(_, d) => setPosition({ x: d.x, y: d.y })}
      bounds="parent"
      className="z-50"
      style={{ display: show ? undefined : "none" }}
    >
      <div ref={ref} className={"p-4 w-80 z-50 " + panelStyle}>
        <h4 className="border-b border-white/50  pb-2 font-bold mb-2 flex items-center justify-between">
          <span>Control IA del Robot</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(true)}
              onTouchEnd={() => setShowSettings(true)}
              className="bg-zinc-700 hover:bg-zinc-600 text-white py-1 px-2 rounded text-sm"
            >
              Configuración
            </button>
            <button
              onClick={onHide}
              onTouchEnd={onHide}
              className="text-xl hover:bg-zinc-800 px-2 rounded-full"
              title="Colapsar"
            >
              ×
            </button>
          </div>
        </h4>
        <div 
          className="mb-2 max-h-[300px] overflow-y-auto"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-2 ${
                msg.sender === "IA" ? "text-green-400" : "text-blue-400"
              }`}
            >
              <strong>{msg.sender === "Usuario" ? "Usuario" : msg.sender}:</strong> {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {messages.length > 0 && (
          <div className="mb-2 flex justify-end">
            <button
              onClick={() => setMessages([])}
              className="text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-2 py-1 rounded"
            >
              Limpiar
            </button>
          </div>
        )}
        <div className="mb-2">
          <MicrophoneSelector
            selectedDeviceId={selectedDeviceId}
            onDeviceChange={setSelectedDeviceId}
          />
        </div>
        <div className="flex items-center space-x-2">{/* Indicador de estado de grabación */}
          {audioRecording.isRecording && (
            <div className="flex items-center space-x-2 text-red-400 text-sm animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
              <span>Grabando... {Math.floor(audioRecording.duration / 1000)}s</span>
            </div>
          )}
          {audioRecording.isProcessing && (
            <div className="flex items-center space-x-2 text-blue-400 text-sm">
              <RiLoader4Line size={16} className="animate-spin" />
              <span>Procesando audio...</span>
            </div>
          )}
          <div className="relative flex items-center w-full">
            <button
              onClick={() => alert("Soporte de cámara próximamente")}
              className="absolute left-0 bg-zinc-700 hover:bg-zinc-600 text-zinc-400 p-2 rounded"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path d="M16 4C16.5523 4 17 4.44772 17 5V9.2L22.2133 5.55071C22.4395 5.39235 22.7513 5.44737 22.9096 5.6736C22.9684 5.75764 23 5.85774 23 5.96033V18.0397C23 18.3158 22.7761 18.5397 22.5 18.5397C22.3974 18.5397 22.2973 18.5081 22.2133 18.4493L17 14.8V19C17 19.5523 16.5523 20 16 20H2C1.44772 20 1 19.5523 1 19V5C1 4.44772 1.44772 4 2 4H16ZM15 6H3V18H15V6ZM7.4 8.82867C7.47607 8.82867 7.55057 8.85036 7.61475 8.8912L11.9697 11.6625C12.1561 11.7811 12.211 12.0284 12.0924 12.2148C12.061 12.2641 12.0191 12.306 11.9697 12.3375L7.61475 15.1088C7.42837 15.2274 7.18114 15.1725 7.06254 14.9861C7.02169 14.9219 7 14.8474 7 14.7713V9.22867C7 9.00776 7.17909 8.82867 7.4 8.82867ZM21 8.84131L17 11.641V12.359L21 15.1587V8.84131Z"></path>{" "}
              </svg>
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              onKeyDown={(e) => e.stopPropagation()}
              onKeyUp={(e) => e.stopPropagation()}
              placeholder="Escribe un comando..."
              className="flex-1 pl-10 pr-10 p-2 rounded bg-zinc-700 text-white outline-none text-sm"
            />
            <button
              onClick={handleMicrophoneClick}
              disabled={audioRecording.isProcessing}
              className={`absolute right-0 p-2 rounded transition-all duration-200 ${
                audioRecording.isRecording
                  ? "bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-lg shadow-red-500/50"
                  : audioRecording.isProcessing
                  ? "bg-zinc-600 text-zinc-400 cursor-not-allowed"
                  : "bg-zinc-700 hover:bg-zinc-600 text-zinc-400 hover:text-white"
              }`}
              title={
                audioRecording.isRecording
                  ? `🔴 GRABANDO... (${Math.floor(audioRecording.duration / 1000)}s) - Habla ahora`
                  : audioRecording.isProcessing
                  ? "🔄 Procesando audio..."
                  : "🎤 Grabar comando de voz"
              }
            >
              {audioRecording.isProcessing ? (
                <RiLoader4Line size={20} className="animate-spin" />
              ) : audioRecording.isRecording ? (
                <div className="relative">
                  <RiMicOffLine size={20} />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                </div>
              ) : (
                <RiMicLine size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        robotName={robotName}
        systemPrompt={configSystemPrompt}
      />
    </Rnd>
  );
}
