"use client";
import React, { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import { generateText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { SettingsModal } from "./SettingsModal";
import { z } from "zod";
import {
  getApiKeyFromLocalStorage,
  getBaseURLFromLocalStorage,
  getSystemPromptFromLocalStorage,
  getModelFromLocalStorage,
} from "../../../lib/chatSettings";
import useMeasure from "react-use-measure";
import { panelStyle } from "@/components/playground/panelStyle";

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

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const apiKey = getApiKeyFromLocalStorage();
  const baseURL = getBaseURLFromLocalStorage() || "https://api.openai.com/v1/";
  const model = getModelFromLocalStorage() || "gpt-4.1-nano";
  const systemPrompt =
    getSystemPromptFromLocalStorage(robotName) ||
    configSystemPrompt || // <-- Use configSystemPrompt if present
    `Puedes ayudar a controlar un robot presionando teclas del teclado. Usa la herramienta keyPress para simular pulsaciones de teclas. Cada tecla se mantendrá presionada durante 1 segundo por defecto. Si el usuario describe que quiere que sea más largo o más corto, ajusta la duración en consecuencia.`;

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
    setMessages((prev) => [...prev, { sender: "Usuario", text: command }]);
    try {
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
                .max(20000)
                .default(1000)
                .describe(
                  "Cuánto tiempo mantener la tecla en milisegundos (por defecto: 1000, mín: 100, máx: 20000)"
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
              const keydownEvent = new KeyboardEvent("keydown", {
                key,
                bubbles: true,
              });
              window.dispatchEvent(keydownEvent);

              // Wait for the specified duration
              await new Promise((resolve) => setTimeout(resolve, holdTime));

              // Simulate keyup event
              const keyupEvent = new KeyboardEvent("keyup", {
                key,
                bubbles: true,
              });
              window.dispatchEvent(keyupEvent);
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
                      .max(20000)
                      .describe(
                        "Cuánto tiempo mantener la tecla en milisegundos (mín: 100, máx: 20000)"
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
              let results: string[] = [];
              
              for (let i = 0; i < sequence.length; i++) {
                const { key, duration, pauseAfter = 100 } = sequence[i];
                
                // Execute keypress
                const keydownEvent = new KeyboardEvent("keydown", {
                  key,
                  bubbles: true,
                });
                window.dispatchEvent(keydownEvent);

                // Wait for the specified duration
                await new Promise((resolve) => setTimeout(resolve, duration));

                // Simulate keyup event
                const keyupEvent = new KeyboardEvent("keyup", {
                  key,
                  bubbles: true,
                });
                window.dispatchEvent(keyupEvent);
                
                results.push(`${i + 1}. Tecla "${key.toUpperCase()}" mantenida durante ${duration} ms`);
                
                // Pause between keystrokes (except for the last one)
                if (i < sequence.length - 1 && pauseAfter > 0) {
                  await new Promise((resolve) => setTimeout(resolve, pauseAfter));
                }
              }
              
              return `Secuencia ejecutada:\n${results.join('\n')}`;
            },
          }),
        },
      });
      let text = result.text.trim();
      const content = result.response?.messages[1]?.content;
      for (const element of content ?? []) {
        if (typeof element === 'object' && element !== null && 'result' in element) {
          text += `\n\n${element.result}`;
        } else if (typeof element === 'string') {
          text += `\n\n${element}`;
        }
      }
      setMessages((prev) => [...prev, { sender: "IA", text }]);
    } catch (error) {
      console.error("Error generating text:", error);
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
        <div className="mb-2 max-h-[60vh] overflow-y-auto">
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
        <div className="flex items-center space-x-2">
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
              className="flex-1 pl-10 p-2 rounded bg-zinc-700 text-white outline-none text-sm"
            />
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
