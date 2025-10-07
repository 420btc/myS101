import React, { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import useMeasure from "react-use-measure";
import { panelStyle } from "@/components/playground/panelStyle";
import { RECORDING_INTERVAL } from "@/config/uiConfig";
import { ReplayHelpDialog } from "./ReplayHelpDialog";
import { 
  createDataset, 
  getDatasets, 
  deleteDataset, 
  SavedDataset 
} from "@/lib/actions/datasets";

interface RecordControlProps {
  show: boolean;
  onHide: () => void;
  isRecording: boolean;
  recordData: number[][];
  startRecording: () => void;
  stopRecording: () => void;
  clearRecordData: () => void;
  loadRecordData?: (data: number[][]) => void;
  updateJointsDegrees?: (updates: { servoId: number; value: number }[]) => void;
  updateJointsSpeed?: (updates: { servoId: number; speed: number }[]) => void;
  jointDetails?: { servoId: number; jointType: "revolute" | "continuous" }[];
  leaderControl?: {
    isConnected: boolean;
    disconnectLeader: () => Promise<void>;
  };
}

// Tipos para el dataset guardado - usando el tipo de la base de datos
type RecordingState = "idle" | "recording" | "paused" | "stopped" | "replaying";

const RecordControl = ({
  show,
  onHide,
  isRecording,
  recordData,
  startRecording,
  stopRecording,
  clearRecordData,
  loadRecordData,
  updateJointsDegrees,
  updateJointsSpeed,
  jointDetails = [],
  leaderControl,
}: RecordControlProps) => {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [ref, bounds] = useMeasure();
  const [replayProgress, setReplayProgress] = useState(0);
  const isReplayingRef = useRef(false);
  const [savedDatasets, setSavedDatasets] = useState<SavedDataset[]>([]);
  const [showSavedDatasets, setShowSavedDatasets] = useState(false);
  const [isLoadedData, setIsLoadedData] = useState(false); // Rastrear si los datos fueron cargados desde la base de datos

  // Cargar datasets guardados al iniciar
  useEffect(() => {
    loadSavedDatasets();
  }, []);

  // Sync recording state with hook
  useEffect(() => {
    if (isRecording && recordingState !== "recording") {
      setRecordingState("recording");
    }
  }, [isRecording, recordingState]);

  // Timer for recording duration
  useEffect(() => {
    if (recordingState !== "recording") return;

    const timer = setInterval(() => {
      setRecordingTime((prev) => prev + RECORDING_INTERVAL / 1000); // Convert ms to seconds
    }, RECORDING_INTERVAL);

    return () => clearInterval(timer);
  }, [recordingState]);

  useEffect(() => {
    if (bounds.height > 0) {
      setPosition({ x: 20, y: 70 });
    }
  }, [bounds.height]);

  // Guardado automático cuando se detiene la grabación (solo si no son datos cargados)
  useEffect(() => {
    if (recordingState === "stopped" && recordData.length > 0 && !isLoadedData) {
      // Guardar automáticamente en la base de datos solo si no son datos cargados
      saveDatasetToDatabase();
    }
  }, [recordingState, recordData.length, isLoadedData]);

  // Funciones para gestión de base de datos
  const loadSavedDatasets = async () => {
    try {
      const datasets = await getDatasets();
      setSavedDatasets(datasets);
    } catch (error) {
      console.error('Error loading saved datasets:', error);
    }
  };

  const saveDatasetToDatabase = async (name?: string) => {
    if (recordData.length === 0) {
      alert('No hay datos para guardar');
      return;
    }

    try {
      const jointNames = jointDetails.map(j => `Joint_${j.servoId}`);
      
      const dataset = await createDataset({
        name: name || `Grabación ${new Date().toLocaleString()}`,
        duration: recordingTime,
        frameCount: recordData.length,
        recordData: recordData,
        jointDetails: {
          jointNames: jointNames,
          jointCount: jointDetails.length
        },
        version: '1.0',
        recordingInterval: RECORDING_INTERVAL
      });
      
      // Recargar la lista de datasets
      await loadSavedDatasets();
      
      console.log('Dataset guardado en base de datos:', dataset.name);
      alert(`Dataset "${dataset.name}" guardado exitosamente en la base de datos`);
    } catch (error) {
      console.error('Error saving dataset to database:', error);
      alert('Error al guardar en la base de datos. Intenta descargar el archivo.');
    }
  };

  const loadDatasetFromDatabase = async (dataset: SavedDataset) => {
    if (recordingState === "recording" || recordingState === "replaying") {
      alert('Detén la grabación o reproducción actual primero');
      return;
    }

    if (!loadRecordData) {
      alert('Función de carga no disponible');
      return;
    }

    try {
      // Cargar los datos del dataset
      loadRecordData(dataset.recordData);
      setRecordingTime(dataset.duration);
      setRecordingState("stopped");
      setIsLoadedData(true); // Marcar que estos datos fueron cargados desde la base de datos
      
      console.log('Dataset cargado:', dataset.name);
      alert(`Dataset "${dataset.name}" cargado exitosamente\nFrames: ${dataset.frameCount}\nDuración: ${formatTime(dataset.duration)}`);
      setShowSavedDatasets(false);
    } catch (error) {
      console.error('Error loading dataset:', error);
      alert('Error al cargar el dataset');
    }
  };

  const deleteDatasetFromDatabase = async (datasetId: string) => {
    try {
      const success = await deleteDataset(datasetId);
      if (success) {
        // Recargar la lista de datasets
        await loadSavedDatasets();
        alert('Dataset eliminado exitosamente');
      } else {
        alert('Error al eliminar el dataset');
      }
    } catch (error) {
      console.error('Error deleting dataset:', error);
    }
  };

  const handleStartRecord = () => {
    setRecordingState("recording");
    setRecordingTime(0);
    setIsLoadedData(false); // Resetear el flag cuando se inicia una nueva grabación
    startRecording();
  };

  const handlePause = () => {
    setRecordingState("paused");
    stopRecording();
  };

  const handleStop = () => {
    setRecordingState("stopped");
    stopRecording();
  };

  const handleReplay = async () => {
    if (recordData.length === 0 || !updateJointsDegrees || !updateJointsSpeed) {
      console.warn("No data to replay or missing update functions");
      return;
    }

    // 如果 leader robot 已连接，先断开连接
    if (leaderControl?.isConnected) {
      console.log("Disconnecting leader robot for replay...");
      try {
        await leaderControl.disconnectLeader();
      } catch (error) {
        console.error("Failed to disconnect leader robot:", error);
        // 即使断开失败也继续 replay
      }
    }

    setRecordingState("replaying");
    isReplayingRef.current = true;
    setReplayProgress(0);

    for (let frameIndex = 0; frameIndex < recordData.length; frameIndex++) {
      if (!isReplayingRef.current) {
        break;
      }
      const frame = recordData[frameIndex];
      const revoluteUpdates: { servoId: number; value: number }[] = [];
      const continuousUpdates: { servoId: number; speed: number }[] = [];

      // Process each joint in the frame
      jointDetails.forEach((joint, jointIndex) => {
        if (jointIndex < frame.length) {
          const value = frame[jointIndex];
          if (joint.jointType === "revolute") {
            revoluteUpdates.push({ servoId: joint.servoId, value });
          } else if (joint.jointType === "continuous") {
            continuousUpdates.push({ servoId: joint.servoId, speed: value });
          }
        }
      });

      // Apply updates
      if (revoluteUpdates.length > 0) {
        await updateJointsDegrees(revoluteUpdates);
      }
      if (continuousUpdates.length > 0) {
        await updateJointsSpeed(continuousUpdates);
      }

      setReplayProgress(frameIndex + 1);

      // Wait for the recording interval between frames to match recording timing
      if (frameIndex < recordData.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, RECORDING_INTERVAL));
      }
    }

    isReplayingRef.current = false;
    setRecordingState("stopped");
    setReplayProgress(0);
  };

  const handleStopReplay = () => {
    isReplayingRef.current = false;
  };

  const handleSave = () => {
    if (recordData.length === 0) {
      alert('No hay datos para guardar');
      return;
    }

    // Crear dataset completo con metadatos
    const dataset = {
      name: `Grabación ${new Date().toLocaleString()}`,
      timestamp: Date.now(),
      duration: recordingTime,
      frameCount: recordData.length,
      recordData: recordData,
      jointDetails: jointDetails,
      metadata: {
        recordingInterval: 20, // ms
        version: "1.0"
      }
    };

    // Descargar como archivo JSON
    const dataStr = JSON.stringify(dataset, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `robot_dataset_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    console.log("Dataset descargado:", dataset.name);
  };

  const handleReset = () => {
    setRecordingState("idle");
    setRecordingTime(0);
    setIsLoadedData(false); // Resetear el flag cuando se resetea
    clearRecordData();
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = (time % 60).toFixed(1);
    return `${minutes}:${seconds.padStart(4, "0")}`;
  };

  if (!show) return null;

  return (
    <Rnd
      position={position}
      onDragStop={(_, d) => setPosition({ x: d.x, y: d.y })}
      bounds="parent"
      className="z-50"
      style={{ display: show ? undefined : "none" }}
    >
      <div
        ref={ref}
        className={"max-h-[90vh] overflow-y-auto text-sm " + panelStyle}
      >
        <h3 className="mt-0 mb-4 border-b border-white/50 pb-1 font-bold text-base flex justify-between items-center">
          <span>Grabar Dataset</span>
          <button
            className="ml-2 text-xl hover:bg-zinc-800 px-2 rounded-full"
            title="Colapsar"
            onClick={onHide}
            onTouchEnd={onHide}
          >
            ×
          </button>
        </h3>

        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span>Duración:</span>
            <span className="font-mono">{formatTime(recordingTime)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Fotogramas:</span>
            <span className="font-mono">
              {recordingState === "replaying"
                ? `${replayProgress}/${recordData.length}`
                : recordData.length}
            </span>
          </div>
        </div>

        <div className="flex gap-3 mb-3">
          <button
            className={`flex-1 px-3 py-2.5 rounded text-xs font-medium ${
              recordingState === "idle" || recordingState === "stopped"
                ? "bg-blue-600 hover:bg-blue-500"
                : recordingState === "paused"
                ? "bg-blue-600 hover:bg-blue-500"
                : "bg-gray-700 cursor-not-allowed"
            }`}
            onClick={
              recordingState === "stopped"
                ? handleReset
                : recordingState === "paused"
                ? () => {
                    setRecordingState("recording");
                    startRecording();
                  }
                : handleStartRecord
            }
            disabled={
              recordingState === "recording" || recordingState === "replaying"
            }
          >
            {recordingState === "paused"
              ? "Reanudar"
              : recordingState === "stopped"
              ? "Nuevo"
              : "Iniciar"}
          </button>

          <button
            className={`flex-1 px-3 py-2.5 rounded text-xs font-medium ${
              recordingState === "recording"
                ? "bg-yellow-600 hover:bg-yellow-500"
                : "bg-gray-700 cursor-not-allowed"
            }`}
            onClick={handlePause}
            disabled={recordingState !== "recording"}
          >
            Pausar
          </button>

          <button
            className={`flex-1 px-3 py-2.5 rounded text-xs font-medium ${
              recordingState === "recording" || recordingState === "paused"
                ? "bg-red-600 hover:bg-red-500"
                : "bg-gray-700 cursor-not-allowed"
            }`}
            onClick={handleStop}
            disabled={
              recordingState === "idle" ||
              recordingState === "stopped" ||
              recordingState === "replaying"
            }
          >
            Detener
          </button>

        </div>

        <div className="flex gap-3 mb-4">
          <button
            className={`flex-1 px-3 py-2.5 rounded text-xs font-medium whitespace-nowrap ${
              recordingState === "stopped"
                ? "bg-blue-600 hover:bg-blue-500"
                : recordingState === "replaying"
                ? "bg-orange-600 hover:bg-orange-500"
                : "bg-gray-700 cursor-not-allowed"
            }`}
            onClick={
              recordingState === "replaying" ? handleStopReplay : handleReplay
            }
            disabled={
              recordingState !== "stopped" && recordingState !== "replaying"
            }
          >
            {recordingState === "replaying" ? "Detener Reproducción" : "Reproducir"}
          </button>
          <ReplayHelpDialog />
        </div>

        <div className="flex gap-3 mb-4">
          <button
            className={`flex-1 px-3 py-2.5 rounded text-xs font-medium ${
              recordingState === "stopped" && recordData.length > 0
                ? "bg-purple-600 hover:bg-purple-500"
                : "bg-gray-700 cursor-not-allowed"
            }`}
            onClick={handleSave}
            disabled={recordingState !== "stopped" || recordData.length === 0}
            title="Descargar dataset como archivo JSON"
          >
            Descargar
          </button>

          <button
            className={`flex-1 px-3 py-2.5 rounded text-xs font-medium ${
              savedDatasets.length > 0
                ? "bg-green-600 hover:bg-green-500"
                : "bg-gray-700 cursor-not-allowed"
            }`}
            onClick={() => setShowSavedDatasets(!showSavedDatasets)}
            disabled={savedDatasets.length === 0}
            title="Ver datasets guardados en localStorage"
          >
            Guardados ({savedDatasets.length})
          </button>
        </div>

        {/* Panel de datasets guardados */}
        {showSavedDatasets && (
          <div className="mt-4 border-t border-white/20 pt-4">
            <h4 className="text-sm font-bold mb-2">Datasets Guardados</h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {savedDatasets.map((dataset) => (
                <div key={dataset.id} className="bg-zinc-800 p-2 rounded text-xs">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium truncate">{dataset.name}</span>
                    <button
                      className="text-red-400 hover:text-red-300 ml-2"
                      onClick={() => deleteDatasetFromDatabase(dataset.id)}
                      title="Eliminar"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-gray-400 text-xs">
                    {dataset.frameCount} frames • {formatTime(dataset.duration)}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {new Date(dataset.timestamp).toLocaleString()}
                  </div>
                  <button
                    className="mt-1 bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded text-xs"
                    onClick={() => loadDatasetFromDatabase(dataset)}
                  >
                    Cargar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Rnd>
  );
};

export default RecordControl;
