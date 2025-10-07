"use client";

import React, { useState, useEffect } from 'react';
import { AudioDevice, getAudioDevices } from '@/hooks/useAudioRecording';
import { Mic, Settings, ChevronDown } from 'lucide-react';

interface MicrophoneSelectorProps {
  selectedDeviceId?: string;
  onDeviceChange: (deviceId: string) => void;
  className?: string;
}

export const MicrophoneSelector: React.FC<MicrophoneSelectorProps> = ({
  selectedDeviceId,
  onDeviceChange,
  className = ""
}) => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setIsLoading(true);
    try {
      const audioDevices = await getAudioDevices();
      setDevices(audioDevices);
      
      // Si no hay dispositivo seleccionado y hay dispositivos disponibles, seleccionar el primero
      if (!selectedDeviceId && audioDevices.length > 0) {
        onDeviceChange(audioDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error al cargar dispositivos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedDevice = devices.find(device => device.deviceId === selectedDeviceId);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors"
        disabled={isLoading}
      >
        <Mic className="w-4 h-4" />
        <span className="truncate max-w-32">
          {isLoading 
            ? 'Cargando...' 
            : selectedDevice?.label || 'Seleccionar micrófono'
          }
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-400 border-b border-gray-600 mb-2">
              <Settings className="w-3 h-3" />
              Dispositivos de audio
            </div>
            
            {devices.length === 0 ? (
              <div className="px-2 py-3 text-sm text-gray-400 text-center">
                No se encontraron micrófonos
              </div>
            ) : (
              <div className="space-y-1">
                {devices.map((device) => (
                  <button
                    key={device.deviceId}
                    onClick={() => {
                      onDeviceChange(device.deviceId);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-2 py-2 rounded text-sm transition-colors ${
                      device.deviceId === selectedDeviceId
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Mic className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{device.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            <div className="border-t border-gray-600 mt-2 pt-2">
              <button
                onClick={() => {
                  loadDevices();
                  setIsOpen(false);
                }}
                className="w-full text-left px-2 py-2 rounded text-xs text-gray-400 hover:bg-gray-700 transition-colors"
              >
                🔄 Actualizar dispositivos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para cerrar el dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default MicrophoneSelector;