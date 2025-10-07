import React, { useRef, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import {
  getApiKeyFromLocalStorage,
  setApiKeyToLocalStorage,
  getBaseURLFromLocalStorage,
  setBaseURLToLocalStorage,
  getSystemPromptFromLocalStorage,
  setSystemPromptToLocalStorage,
  getModelFromLocalStorage,
  setModelToLocalStorage,
} from "../../../lib/chatSettings";

interface SettingsModalProps {
  show: boolean;
  onClose: () => void;
  robotName?: string;
  systemPrompt?: string; // <-- Add this line
}

export function SettingsModal({
  show,
  onClose,
  robotName,
  systemPrompt: configSystemPrompt, // <-- Add this line
}: SettingsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const [apiKey, setApiKeyState] = useState("");
  const [baseURL, setBaseURLState] = useState("");
  const [systemPrompt, setSystemPromptState] = useState("");
  const [model, setModelState] = useState("");

  type ModelType = "OpenAI" | "Ollama" | "Custom";
  const [modelType, setModelType] = useState<ModelType>("OpenAI");
  const [showUseDefaultPrompt, setShowUseDefaultPrompt] = useState(false);

  // Auto-detect type and set recommended defaults
  useEffect(() => {
    if (show) {
      const base = getBaseURLFromLocalStorage();
      setApiKeyState(getApiKeyFromLocalStorage());
      if (
        base === "https://api.openai.com/v1/" ||
        base === "" ||
        base == null
      ) {
        setModelType("OpenAI");
        setBaseURLState("https://api.openai.com/v1/");
        setModelState(getModelFromLocalStorage() || "gpt-4.1-nano");
      } else if (base === "http://localhost:11434/v1") {
        setModelType("Ollama");
        setBaseURLState("http://localhost:11434/v1");
        setModelState(getModelFromLocalStorage() || "mistral-small3.1");
      } else {
        setModelType("Custom");
        setBaseURLState(base);
        setModelState(getModelFromLocalStorage());
      }
      setSystemPromptState(
        getSystemPromptFromLocalStorage(robotName) || configSystemPrompt || ""
      );
      const localPrompt = getSystemPromptFromLocalStorage(robotName) || "";
      const configPrompt = configSystemPrompt || "";
      // Only show button if localPrompt is not empty and differs from configPrompt
      setShowUseDefaultPrompt(
        localPrompt !== "" && localPrompt !== configPrompt && !!configPrompt
      );
    }
  }, [show, robotName, configSystemPrompt]);

  // When switching LLM type, only change Base URL, keep other values unchanged
  const handleModelTypeChange = (type: ModelType) => {
    setModelType(type);
    if (type === "OpenAI") {
      setBaseURLState("https://api.openai.com/v1/");
    } else if (type === "Ollama") {
      setBaseURLState("http://localhost:11434/v1");
    } else {
      setBaseURLState(getBaseURLFromLocalStorage() || "");
    }
  };

  useEffect(() => {
    if (!show) return;
    function handleClickOutside(event: MouseEvent) {
      // Evitar cerrar el modal si se hace clic en el textarea o sus elementos hijos
      const target = event.target as Node;
      if (
        modalRef.current &&
        !modalRef.current.contains(target)
      ) {
        onClose();
      }
    }
    // Usar 'mousedown' en lugar de 'click' para mejor control
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, onClose]);

  if (!show) return null;

  const handleSave = () => {
    setApiKeyToLocalStorage(apiKey);
    setBaseURLToLocalStorage(baseURL);
    // Only save system prompt if the current prompt is not the default one
    const defaultPrompt = configSystemPrompt || "";
    if (systemPrompt !== defaultPrompt) {
      setSystemPromptToLocalStorage(systemPrompt, robotName);
    }
    setModelToLocalStorage(model);
    onClose();
  };

  // Prevenir la propagación de eventos del modal
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      style={{ userSelect: 'none' }} // Prevenir selección accidental en el overlay
    >
      <div
        ref={modalRef}
        className="bg-zinc-800 p-6 rounded-lg shadow-xl w-96 max-w-full lg:w-[500px] xl:w-[600px] mx-4"
        onClick={handleModalClick}
        style={{ userSelect: 'text' }} // Permitir selección dentro del modal
      >
        {/* LLM type selection - options on the right */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xl font-bold text-white">LLM:</span>
          <select
            value={modelType}
            onChange={(e) => handleModelTypeChange(e.target.value as ModelType)}
            className="p-1 rounded bg-zinc-700 text-white outline-none text-base font-semibold ml-4"
          >
            <option value="OpenAI">OpenAI</option>
            <option value="Ollama">Ollama</option>
            <option value="Custom">Custom</option>
          </select>
        </div>
        {/* LLM description */}
        <div className="mb-2 text-xs text-zinc-300 text-right">
          {modelType === "OpenAI" && (
            <>
              Obtén tu clave API de OpenAI en
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-300 ml-1"
              >
                https://platform.openai.com/api-keys
              </a>
              .<br />
              La clave API se almacena solo en tu navegador.
            </>
          )}
          {modelType === "Ollama" && (
            <>
              Ollama local no requiere una clave API.
              <br />
              Asegúrate de que el servicio Ollama esté ejecutándose localmente.
              <br />
              Descarga Ollama en https://ollama.com/download
            </>
          )}
          {modelType === "Custom" && (
            <>Cualquier LLM compatible con OpenAI puede usarse aquí.</>
          )}
        </div>
        {/* API Key */}
        <div className="flex items-center mb-4 ml-4">
          <label className="text-white font-medium flex items-center mr-2 whitespace-nowrap">
            Clave API:
          </label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKeyState(e.target.value)}
            placeholder={modelType === "Ollama" ? "" : "sk-..."}
            className="flex-1 p-2 rounded bg-zinc-700 text-white outline-none"
          />
        </div>
        {/* Base URL */}
        <div className="flex items-center mb-4 ml-4">
          <label className="text-white font-medium mr-2 whitespace-nowrap">
            URL Base:
          </label>
          <input
            type="text"
            value={baseURL}
            onChange={(e) => setBaseURLState(e.target.value)}
            placeholder={
              modelType === "OpenAI"
                ? "No requerido"
                : modelType === "Ollama"
                ? "http://localhost:11434/v1"
                : "http://your-custom-endpoint/v1"
            }
            className="flex-1 p-2 rounded bg-zinc-700 text-white outline-none"
          />
        </div>
        {/* Model */}
        <div className="flex items-center mb-4 ml-4">
          <label className="text-white font-medium mr-2 whitespace-nowrap">
            Modelo:
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModelState(e.target.value)}
            placeholder={
              modelType === "Ollama"
                ? "mistral-small3.1"
                : modelType === "OpenAI"
                ? "gpt-4.1-nano"
                : ""
            }
            className="flex-1 p-2 rounded bg-zinc-700 text-white outline-none"
          />
        </div>
        {/* Divider */}
        <hr className="my-4 border-zinc-600" />
        {/* System Prompt Section */}
        <div>
          <div className="mb-2 flex items-center">
            <span className="block text-xl font-bold text-white">
              Prompt del Sistema:
            </span>
            {showUseDefaultPrompt && (
              <button
                className="ml-3 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                onClick={() => {
                  if (
                    window.confirm(
                      "Tu prompt será reemplazado con el prompt predeterminado. Por favor copia tu prompt actual si quieres guardarlo."
                    )
                  ) {
                    setSystemPromptState(configSystemPrompt || "");
                    setSystemPromptToLocalStorage(
                      configSystemPrompt || "",
                      robotName
                    );
                    setShowUseDefaultPrompt(false);
                  }
                }}
                title="Usar prompt predeterminado"
              >
                Usar prompt predeterminado
              </button>
            )}
          </div>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPromptState(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()} // Prevenir interferencia con el modal
            onFocus={(e) => e.stopPropagation()} // Prevenir interferencia al hacer focus
            placeholder="Prompt del sistema para el modelo de IA"
            rows={8}
            className="w-full p-3 rounded bg-zinc-700 text-white mb-4 outline-none min-h-[120px] text-base resize-y border border-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              userSelect: 'text', // Asegurar que se puede seleccionar texto
              WebkitUserSelect: 'text', // Para Safari
              MozUserSelect: 'text' // Para Firefox
            }}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            tabIndex={0} // Asegurar que es focuseable
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="bg-zinc-600 hover:bg-zinc-500 text-white px-4 py-2 rounded"
          >
            Cerrar
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );

  return typeof window !== "undefined"
    ? ReactDOM.createPortal(modalContent, document.body)
    : null;
}
