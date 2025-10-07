"use client";

import React, { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import {
  UpdateJointDegrees,
  UpdateJointsDegrees,
} from "../../../hooks/useRobotControl";
import { panelStyle } from "@/components/playground/panelStyle";
import useMeasure from "react-use-measure";

type JointDetails = {
  name: string;
  servoId: number;
  limit: {
    lower?: number;
    upper?: number;
  };
  jointType: "revolute" | "continuous";
};

type WASDControlProps = {
  jointDetails: JointDetails[];
  updateJointDegrees: UpdateJointDegrees;
  updateJointsDegrees: UpdateJointsDegrees;
  onHide?: () => void;
  show?: boolean;
};

const MOVEMENT_STEP = 0.2; // Velocidad muy reducida para control ultra preciso, consistente con RevoluteJointsTable
const CONTINUOUS_INTERVAL = 16; // ~60fps for smooth animation, consistent with RevoluteJointsTable

export function WASDControl({
  show = true,
  onHide,
  jointDetails,
  updateJointDegrees,
  updateJointsDegrees,
}: WASDControlProps) {
  const [position, setPosition] = useState({ x: 20, y: 120 });
  const [ref, bounds] = useMeasure();
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Estado para mantener las posiciones actuales de las articulaciones
  const [jointPositions, setJointPositions] = useState<Record<number, number>>({});

  // Mapeo de teclas a articulaciones y movimientos (adaptado para teclado español)
  const keyMapping = {
    // WQSD - Movimientos básicos con inversos
    'w': { joint: 'Pitch', direction: 1, description: 'Subir brazo' },
    's': { joint: 'Pitch', direction: -1, description: 'Bajar brazo' },
    'q': { joint: 'Rotation', direction: -1, description: 'Rotar izquierda' }, // A → Q en teclado español
    'd': { joint: 'Rotation', direction: 1, description: 'Rotar derecha' },
    
    // ZXC - Movimientos extras con inversos
    'z': { joint: 'Elbow', direction: 1, description: 'Doblar codo' },
    'x': { joint: 'Elbow', direction: -1, description: 'Extender codo' },
    'c': { joint: 'Wrist_Pitch', direction: 1, description: 'Muñeca arriba' },
    'v': { joint: 'Wrist_Pitch', direction: -1, description: 'Muñeca abajo' },
    
    // Teclas numéricas para movimientos adicionales
    '1': { joint: 'Wrist_Roll', direction: 1, description: 'Rotar muñeca derecha' },
    '2': { joint: 'Wrist_Roll', direction: -1, description: 'Rotar muñeca izquierda' },
    '3': { joint: 'Jaw', direction: 1, description: 'Abrir mandíbula' },
    '4': { joint: 'Jaw', direction: -1, description: 'Cerrar mandíbula' },
  };

  // Obtener ID de articulación por nombre
  const getJointId = (jointName: string): number | null => {
    const joint = jointDetails.find(j => j.name === jointName);
    return joint?.servoId || null;
  };

  // Manejar movimiento de articulación
  const moveJoint = (jointName: string, direction: number) => {
    const jointId = getJointId(jointName);
    if (jointId) {
      // Obtener la posición actual o usar 0 como valor por defecto
      const currentPosition = jointPositions[jointId] || 0;
      const newPosition = currentPosition + (MOVEMENT_STEP * direction);
      
      // Actualizar el estado local
      setJointPositions(prev => ({
        ...prev,
        [jointId]: newPosition
      }));
      
      // Enviar la nueva posición absoluta
      updateJointDegrees(jointId, newPosition);
    }
  };

  // Manejar eventos de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!show) return;
      
      const key = event.key.toLowerCase();
      if (keyMapping[key as keyof typeof keyMapping] && !activeKeys.has(key)) {
        event.preventDefault();
        setActiveKeys(prev => new Set(prev).add(key));
        
        const mapping = keyMapping[key as keyof typeof keyMapping];
        moveJoint(mapping.joint, mapping.direction);
        
        // Iniciar movimiento continuo
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          moveJoint(mapping.joint, mapping.direction);
        }, CONTINUOUS_INTERVAL);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (keyMapping[key as keyof typeof keyMapping]) {
        event.preventDefault();
        
        // Actualizar activeKeys primero
        setActiveKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          
          // Detener movimiento continuo si no hay teclas activas
          if (newSet.size === 0) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
          
          return newSet;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [show, activeKeys, jointDetails, updateJointDegrees]);

  // Renderizar botón de control
  const renderControlButton = (keyChar: string, mapping: any) => {
    const isActive = activeKeys.has(keyChar);
    return (
      <button
        key={keyChar}
        className={`
          px-3 py-2 m-1 text-xs font-bold rounded border-2 transition-all duration-150
          ${isActive 
            ? 'bg-blue-600 border-blue-400 text-white shadow-lg scale-105' 
            : 'bg-zinc-700 border-zinc-600 text-zinc-200 hover:bg-zinc-600'
          }
        `}
        onMouseDown={() => {
          setActiveKeys(prev => new Set(prev).add(keyChar));
          moveJoint(mapping.joint, mapping.direction);
        }}
        onMouseUp={() => {
          setActiveKeys(prev => {
            const newSet = new Set(prev);
            newSet.delete(keyChar);
            return newSet;
          });
        }}
        onMouseLeave={() => {
          setActiveKeys(prev => {
            const newSet = new Set(prev);
            newSet.delete(keyChar);
            return newSet;
          });
        }}
        title={mapping.description}
      >
        {keyChar.toUpperCase()}
      </button>
    );
  };

  return (
    <Rnd
      position={position}
      onDragStop={(_, d) => {
        setPosition({ x: d.x, y: d.y });
      }}
      bounds="parent"
      className="z-50"
      style={{ display: show ? undefined : "none" }}
      dragHandleClassName="drag-handle"
    >
      <div
        ref={ref}
        className={"max-h-[80vh] overflow-y-auto text-sm " + panelStyle}
      >
        <h3 className="mt-0 mb-4 border-b border-white/50 pb-1 font-bold text-base flex justify-between items-center drag-handle cursor-move">
          <span>Control WQSD/ZXCV/1234</span>
          <button
            onClick={onHide}
            onTouchEnd={onHide}
            className="ml-2 text-xl hover:bg-zinc-800 px-2 rounded-full cursor-pointer"
            title="Colapsar"
          >
            ×
          </button>
        </h3>

        <div className="space-y-4">
          {/* Sección WQSD - Movimientos básicos */}
          <div>
            <h4 className="text-sm font-semibold mb-2 text-zinc-300">
              Movimientos Básicos (WQSD)
            </h4>
            <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
              <div></div>
              {renderControlButton('w', keyMapping.w)}
              <div></div>
              {renderControlButton('q', keyMapping.q)}
              {renderControlButton('s', keyMapping.s)}
              {renderControlButton('d', keyMapping.d)}
            </div>
          </div>

          {/* Sección ZXCV - Movimientos extras */}
          <div>
            <h4 className="text-sm font-semibold mb-2 text-zinc-300">
              Movimientos Extras (ZXCV)
            </h4>
            <div className="flex justify-center gap-1">
              {renderControlButton('z', keyMapping.z)}
              {renderControlButton('x', keyMapping.x)}
              {renderControlButton('c', keyMapping.c)}
              {renderControlButton('v', keyMapping.v)}
            </div>
          </div>

          {/* Controles adicionales */}
          <div>
            <h4 className="text-sm font-semibold mb-2 text-zinc-300">
              Controles Adicionales (1234)
            </h4>
            <div className="flex justify-center gap-1">
              {renderControlButton('1', keyMapping['1'])}
              {renderControlButton('2', keyMapping['2'])}
              {renderControlButton('3', keyMapping['3'])}
              {renderControlButton('4', keyMapping['4'])}
            </div>
          </div>

          {/* Leyenda */}
          <div className="text-xs text-zinc-400 border-t border-zinc-600 pt-2">
            <p><strong>W/S:</strong> Subir/Bajar brazo</p>
            <p><strong>Q/D:</strong> Rotar izquierda/derecha</p>
            <p><strong>Z/X:</strong> Doblar/Extender codo</p>
            <p><strong>C/V:</strong> Muñeca arriba/abajo</p>
            <p><strong>1/2:</strong> Rotar muñeca derecha/izquierda</p>
            <p><strong>3/4:</strong> Abrir/Cerrar mandíbula</p>
          </div>
        </div>
      </div>
    </Rnd>
  );
}