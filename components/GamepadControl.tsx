"use client";

import React from "react";
import { Rnd } from "react-rnd";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { panelStyle } from "@/components/playground/panelStyle";
import { RiCloseFill, RiGamepadFill, RiSettings3Fill } from "@remixicon/react";
import { GamepadControlConfig } from "../hooks/useGamepadRobotControl";
import { GamepadMapping, GamepadState } from "../hooks/useGamepadControl";

interface GamepadControlProps {
  show: boolean;
  onHide: () => void;
  isConnected: boolean;
  config: GamepadControlConfig;
  onConfigChange: (config: Partial<GamepadControlConfig>) => void;
  currentGamepadState?: GamepadState;
  onForceDetection?: () => void;
}

export function GamepadControl({
  show,
  onHide,
  isConnected,
  config,
  onConfigChange,
  currentGamepadState,
  onForceDetection,
}: GamepadControlProps) {
  if (!show) return null;

  const handleSensitivityChange = (value: number) => {
    onConfigChange({ sensitivity: value });
  };

  const handleDeadZoneChange = (value: number) => {
    onConfigChange({ deadZone: value });
  };

  const handleEnabledToggle = () => {
    onConfigChange({ enabled: !config.enabled });
  };

  const renderGamepadVisual = () => {
    if (!currentGamepadState) return null;

    return (
      <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <RiGamepadFill className="w-4 h-4" />
          Estado del Joystick
        </h4>
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          {/* Stick Izquierdo */}
          <div className="space-y-2">
            <div className="text-gray-300">Stick Izquierdo</div>
            <div className="bg-gray-700/50 rounded p-2">
              <div>X: {currentGamepadState.axes?.[0]?.toFixed(2) || '0.00'}</div>
              <div>Y: {currentGamepadState.axes?.[1]?.toFixed(2) || '0.00'}</div>
            </div>
          </div>

          {/* Stick Derecho */}
          <div className="space-y-2">
            <div className="text-gray-300">Stick Derecho</div>
            <div className="bg-gray-700/50 rounded p-2">
              <div>X: {currentGamepadState.axes?.[2]?.toFixed(2) || '0.00'}</div>
              <div>Y: {currentGamepadState.axes?.[3]?.toFixed(2) || '0.00'}</div>
            </div>
          </div>

          {/* Gatillos */}
          <div className="space-y-2">
            <div className="text-gray-300">Gatillos</div>
            <div className="bg-gray-700/50 rounded p-2">
              <div>L: {currentGamepadState.axes?.[4]?.toFixed(2) || '0.00'}</div>
              <div>R: {currentGamepadState.axes?.[5]?.toFixed(2) || '0.00'}</div>
            </div>
          </div>

          {/* Botones */}
          <div className="space-y-2">
            <div className="text-gray-300">Botones</div>
            <div className="bg-gray-700/50 rounded p-2 space-y-1">
              <div className="flex gap-2">
                <span className={`w-2 h-2 rounded-full ${currentGamepadState.buttons?.[0] ? 'bg-green-400' : 'bg-gray-600'}`}></span>
                <span className="text-xs">A</span>
              </div>
              <div className="flex gap-2">
                <span className={`w-2 h-2 rounded-full ${currentGamepadState.buttons?.[1] ? 'bg-green-400' : 'bg-gray-600'}`}></span>
                <span className="text-xs">B</span>
              </div>
              <div className="flex gap-2">
                <span className={`w-2 h-2 rounded-full ${currentGamepadState.buttons?.[2] ? 'bg-green-400' : 'bg-gray-600'}`}></span>
                <span className="text-xs">X</span>
              </div>
              <div className="flex gap-2">
                <span className={`w-2 h-2 rounded-full ${currentGamepadState.buttons?.[3] ? 'bg-green-400' : 'bg-gray-600'}`}></span>
                <span className="text-xs">Y</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Rnd
      default={{
        x: window.innerWidth - 420,
        y: 100,
        width: 400,
        height: 600,
      }}
      minWidth={350}
      minHeight={500}
      bounds="window"
      dragHandleClassName="drag-handle"
      className="z-50"
    >
      <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl h-full flex flex-col">
        {/* Header */}
        <div className="drag-handle flex items-center justify-between p-4 border-b border-white/10 cursor-move">
          <div className="flex items-center gap-2">
            <RiGamepadFill className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">
              Control de Joystick Xbox 360
            </h3>
          </div>
          <Button
            onClick={onHide}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            <RiCloseFill className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* Estado de Conexión */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estado de Conexión</span>
                <div className={`px-2 py-1 rounded text-xs ${
                  isConnected 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </div>
              </div>

              {/* Información del gamepad detectado */}
              <div className="space-y-2">
                <span className="text-sm font-medium">Gamepad Detectado</span>
                <div className="text-xs text-gray-400 bg-black/20 p-2 rounded border">
                  {currentGamepadState?.connected ? (
                    <div>
                      <div>ID: {currentGamepadState.gamepadIndex !== null ? `Gamepad ${currentGamepadState.gamepadIndex}` : 'N/A'}</div>
                      <div>Botones: {currentGamepadState.buttons?.length || 0}</div>
                      <div>Ejes: {currentGamepadState.axes?.length || 0}</div>
                    </div>
                  ) : (
                    <div>
                      <div>No hay gamepad conectado</div>
                      <div className="mt-1 text-yellow-400 space-y-2">
                        <div><strong>Para conectar tu Xbox Controller:</strong></div>
                        <div>1. <strong>Conecta por USB:</strong> Usa un cable USB-C o micro-USB</div>
                        <div>2. <strong>Conecta por Bluetooth:</strong></div>
                        <div className="ml-4 text-xs space-y-1">
                          <div>• Mantén presionado el botón Xbox + botón de sincronización</div>
                          <div>• Ve a Configuración → Bluetooth en Windows</div>
                          <div>• Selecciona "Xbox Wireless Controller"</div>
                        </div>
                        <div>3. <strong>Presiona cualquier botón</strong> en el mando después de conectar</div>
                        <div>4. <strong>Abre la consola del navegador</strong> (F12) para ver logs de detección</div>
                        <div className="text-orange-400 mt-2">
                          <strong>Nota:</strong> Si aparecen 4 gamepads como "null", el navegador detecta slots vacíos pero no hay dispositivos conectados físicamente.
                        </div>
                        <div className="bg-gray-800/50 rounded p-2 mt-2">
                          <div className="text-xs text-gray-400 mb-1">Información de depuración:</div>
                          <div className="text-xs text-gray-300">
                            <div>Slots detectados: {navigator.getGamepads ? navigator.getGamepads().length : 'API no disponible'}</div>
                            <div>Gamepads activos: {navigator.getGamepads ? navigator.getGamepads().filter(g => g !== null).length : 0}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón para forzar detección */}
              <Button 
                onClick={() => {
                  console.log('Forzando detección de gamepads...');
                  if (onForceDetection) {
                    onForceDetection();
                  } else {
                    // Fallback: forzar una nueva detección
                    window.dispatchEvent(new Event('gamepadconnected' as any));
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Detectar Gamepads
              </Button>
            </div>
          </div>

          {/* Control de Activación */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Control Habilitado</span>
              <Button
                onClick={handleEnabledToggle}
                variant={config.enabled ? "default" : "outline"}
                size="sm"
                disabled={!isConnected}
              >
                {config.enabled ? "Activado" : "Desactivado"}
              </Button>
            </div>
          </div>

          {/* Configuración */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <RiSettings3Fill className="w-4 h-4" />
              Configuración
            </h4>
            
            <div className="space-y-4">
              {/* Sensibilidad */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Sensibilidad: {config.sensitivity.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={config.sensitivity}
                  onChange={(e) => handleSensitivityChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Zona Muerta */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Zona Muerta: {(config.deadZone * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.3"
                  step="0.01"
                  value={config.deadZone}
                  onChange={(e) => handleDeadZoneChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>

          {/* Mapeo de Controles */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-3">
              Mapeo de Controles
            </h4>
            <div className="text-xs text-gray-300 space-y-1">
              <div><strong>Stick Izquierdo:</strong> Rotación Base (X) y Pitch (Y)</div>
              <div><strong>Stick Derecho:</strong> Wrist Roll (X) y Wrist Pitch (Y)</div>
              <div><strong>Gatillos:</strong> Elbow (LT hacia adentro, RT hacia afuera)</div>
              <div><strong>Botón A:</strong> Cerrar Jaw</div>
              <div><strong>Botón B:</strong> Abrir Jaw</div>
              <div><strong>Botón X:</strong> Jaw Down/Up</div>
              <div><strong>Botón Y:</strong> Jaw Backward/Forward</div>
              <div><strong>D-Pad Up:</strong> Posición Home</div>
              <div><strong>D-Pad Down:</strong> Reset</div>
              <div><strong>LB/RB:</strong> Velocidad Lenta/Rápida</div>
            </div>
          </div>

          {/* Estado Visual del Gamepad */}
          {isConnected && renderGamepadVisual()}
        </div>
      </div>
    </Rnd>
  );
}