"use client";

import { useEffect, useCallback, useRef } from "react";
import { useGamepadControl, GamepadMapping } from "./useGamepadControl";
import { UpdateJointDegrees, UpdateJointsSpeed, UpdateJointsDegrees } from "./useRobotControl";

export interface GamepadRobotMapping {
  // Mapeo de ejes analógicos a articulaciones
  leftStickX: number | null;    // Rotación base (joint 1)
  leftStickY: number | null;    // Pitch (joint 2)
  rightStickX: number | null;   // Wrist Roll (joint 5)
  rightStickY: number | null;   // Wrist Pitch (joint 4)
  leftTrigger: number | null;   // Elbow hacia adentro (joint 3)
  rightTrigger: number | null;  // Elbow hacia afuera (joint 3)
  
  // Mapeo de botones a acciones específicas
  buttonA: string | null;       // Jaw close
  buttonB: string | null;       // Jaw open
  buttonX: string | null;       // Compound movement 1
  buttonY: string | null;       // Compound movement 2
  leftBumper: string | null;    // Speed modifier (slow)
  rightBumper: string | null;   // Speed modifier (fast)
  dPadUp: string | null;        // Preset position 1
  dPadDown: string | null;      // Preset position 2
  dPadLeft: string | null;      // Preset position 3
  dPadRight: string | null;     // Preset position 4
}

export interface GamepadControlConfig {
  enabled: boolean;
  sensitivity: number;          // Multiplicador de sensibilidad (0.1 - 2.0)
  deadZone: number;            // Zona muerta para sticks (0.05 - 0.3)
  updateRate: number;          // Frecuencia de actualización en ms (16-100)
  speedModifier: {
    slow: number;              // Multiplicador para modo lento (0.1 - 0.5)
    normal: number;            // Multiplicador normal (0.5 - 1.0)
    fast: number;              // Multiplicador para modo rápido (1.0 - 2.0)
  };
}

const defaultConfig: GamepadControlConfig = {
  enabled: true,
  sensitivity: 1.0,
  deadZone: 0.15,
  updateRate: 50, // 20 FPS
  speedModifier: {
    slow: 0.3,
    normal: 1.0,
    fast: 1.8,
  },
};

const defaultMapping: GamepadRobotMapping = {
  // Ejes analógicos -> Articulaciones del SO100/SO101
  leftStickX: 1,      // Stick izquierdo X -> Rotación base
  leftStickY: 2,      // Stick izquierdo Y -> Pitch
  rightStickX: 5,     // Stick derecho X -> Wrist Roll
  rightStickY: 4,     // Stick derecho Y -> Wrist Pitch
  leftTrigger: 3,     // Gatillo izquierdo -> Elbow (hacia adentro)
  rightTrigger: 3,    // Gatillo derecho -> Elbow (hacia afuera)
  
  // Botones -> Acciones específicas
  buttonA: "6",       // A -> Jaw close (tecla 6)
  buttonB: "y",       // B -> Jaw open (tecla y)
  buttonX: "i",       // X -> Compound jaw down/up
  buttonY: "u",       // Y -> Compound jaw backward/forward
  leftBumper: null,   // LB -> Speed slow (modificador)
  rightBumper: null,  // RB -> Speed fast (modificador)
  dPadUp: "home",     // D-Pad Up -> Home position
  dPadDown: "reset",  // D-Pad Down -> Reset position
  dPadLeft: null,     // D-Pad Left -> Preset 3
  dPadRight: null,    // D-Pad Right -> Preset 4
};

export function useGamepadRobotControl(
  updateJointDegrees: UpdateJointDegrees,
  updateJointsSpeed: UpdateJointsSpeed,
  isConnected: boolean,
  config: Partial<GamepadControlConfig> = {},
  updateJointsDegrees?: UpdateJointsDegrees
) {
  const finalConfig = { ...defaultConfig, ...config };
  const { gamepadMapping, gamepadState, isConnected: gamepadConnected, forceDetection } = useGamepadControl(finalConfig.deadZone);
  const mapping = defaultMapping;
  
  const lastUpdateRef = useRef<number>(0);
  const previousMappingRef = useRef<GamepadMapping | null>(null);
  const activeMovementsRef = useRef<Set<number>>(new Set());

  // Función para simular presión de tecla
  const simulateKeyPress = useCallback((key: string, duration: number = 100) => {
    if (!isConnected) return;
    
    // Simular keydown
    const keydownEvent = new KeyboardEvent('keydown', {
      key: key,
      code: `Key${key.toUpperCase()}`,
      bubbles: true,
    });
    document.dispatchEvent(keydownEvent);

    // Simular keyup después del duration
    setTimeout(() => {
      const keyupEvent = new KeyboardEvent('keyup', {
        key: key,
        code: `Key${key.toUpperCase()}`,
        bubbles: true,
      });
      document.dispatchEvent(keyupEvent);
    }, duration);
  }, [isConnected]);

  // Función para manejar movimientos analógicos continuos
  const handleAnalogMovement = useCallback((
    jointId: number,
    value: number,
    speedModifier: number = 1.0
  ) => {
    if (!isConnected || Math.abs(value) < finalConfig.deadZone) {
      activeMovementsRef.current.delete(jointId);
      return;
    }

    const adjustedValue = value * finalConfig.sensitivity * speedModifier;
    const speed = Math.abs(adjustedValue) * 100; // Convertir a velocidad (0-100)
    
    // Actualizar velocidad de la articulación
    updateJointsSpeed([{
      servoId: jointId,
      speed: Math.min(Math.max(speed, 10), 100) // Limitar entre 10-100
    }]);

    // Determinar dirección y simular tecla correspondiente
    const direction = adjustedValue > 0 ? 1 : -1;
    const keyMap: { [key: number]: string[] } = {
      1: ["1", "q"],  // Rotación base
      2: ["2", "w"],  // Pitch
      3: ["3", "e"],  // Elbow
      4: ["4", "r"],  // Wrist Pitch
      5: ["5", "t"],  // Wrist Roll
      6: ["6", "y"],  // Jaw
    };

    const keys = keyMap[jointId];
    if (keys) {
      const key = direction > 0 ? keys[1] : keys[0];
      
      // Solo enviar comando si no está ya activo
      if (!activeMovementsRef.current.has(jointId)) {
        activeMovementsRef.current.add(jointId);
        simulateKeyPress(key, finalConfig.updateRate);
      }
    }
  }, [isConnected, finalConfig, updateJointsSpeed, simulateKeyPress]);

  // Función para manejar botones
  const handleButtonPress = useCallback((
    buttonKey: string | null,
    isPressed: boolean,
    wasPressed: boolean
  ) => {
    if (!isConnected || !buttonKey) return;

    // Detectar transición de no presionado a presionado
    if (isPressed && !wasPressed) {
      if (buttonKey === "home") {
        // Posición home - mover todas las articulaciones a 180°
        const homePositions = [
          { servoId: 1, value: 180 },
          { servoId: 2, value: 180 },
          { servoId: 3, value: 180 },
          { servoId: 4, value: 180 },
          { servoId: 5, value: 180 },
          { servoId: 6, value: 180 },
        ];
        
        if (updateJointsDegrees) {
          updateJointsDegrees(homePositions);
        } else {
          // Fallback: actualizar una por una
          homePositions.forEach(({ servoId, value }) => {
            updateJointDegrees(servoId, value);
          });
        }
      } else if (buttonKey === "reset") {
        // Reset - detener todos los movimientos
        activeMovementsRef.current.clear();
        updateJointsSpeed([
          { servoId: 1, speed: 50 },
          { servoId: 2, speed: 50 },
          { servoId: 3, speed: 50 },
          { servoId: 4, speed: 50 },
          { servoId: 5, speed: 50 },
          { servoId: 6, speed: 50 },
        ]);
      } else {
        // Simular presión de tecla normal
        simulateKeyPress(buttonKey, 200);
      }
    }
  }, [isConnected, updateJointDegrees, updateJointsSpeed, simulateKeyPress]);

  // Loop principal de control
  useEffect(() => {
    if (!finalConfig.enabled || !gamepadConnected || !isConnected) {
      return;
    }

    const updateInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastUpdateRef.current < finalConfig.updateRate) {
        return;
      }

      const previous = previousMappingRef.current;
      
      // Determinar modificador de velocidad
      let speedModifier = finalConfig.speedModifier.normal;
      if (gamepadMapping.leftBumper) {
        speedModifier = finalConfig.speedModifier.slow;
      } else if (gamepadMapping.rightBumper) {
        speedModifier = finalConfig.speedModifier.fast;
      }

      // Manejar ejes analógicos
      if (mapping.leftStickX !== null) {
        handleAnalogMovement(mapping.leftStickX, gamepadMapping.leftStickX, speedModifier);
      }
      if (mapping.leftStickY !== null) {
        handleAnalogMovement(mapping.leftStickY, -gamepadMapping.leftStickY, speedModifier); // Invertir Y
      }
      if (mapping.rightStickX !== null) {
        handleAnalogMovement(mapping.rightStickX, gamepadMapping.rightStickX, speedModifier);
      }
      if (mapping.rightStickY !== null) {
        handleAnalogMovement(mapping.rightStickY, -gamepadMapping.rightStickY, speedModifier); // Invertir Y
      }

      // Manejar gatillos (triggers)
      if (mapping.leftTrigger !== null && gamepadMapping.leftTrigger > 0.1) {
        handleAnalogMovement(mapping.leftTrigger, -gamepadMapping.leftTrigger, speedModifier); // Dirección negativa
      }
      if (mapping.rightTrigger !== null && gamepadMapping.rightTrigger > 0.1) {
        handleAnalogMovement(mapping.rightTrigger, gamepadMapping.rightTrigger, speedModifier); // Dirección positiva
      }

      // Manejar botones
      handleButtonPress(mapping.buttonA, gamepadMapping.buttonA, previous?.buttonA || false);
      handleButtonPress(mapping.buttonB, gamepadMapping.buttonB, previous?.buttonB || false);
      handleButtonPress(mapping.buttonX, gamepadMapping.buttonX, previous?.buttonX || false);
      handleButtonPress(mapping.buttonY, gamepadMapping.buttonY, previous?.buttonY || false);
      handleButtonPress(mapping.dPadUp, gamepadMapping.dPadUp, previous?.dPadUp || false);
      handleButtonPress(mapping.dPadDown, gamepadMapping.dPadDown, previous?.dPadDown || false);
      handleButtonPress(mapping.dPadLeft, gamepadMapping.dPadLeft, previous?.dPadLeft || false);
      handleButtonPress(mapping.dPadRight, gamepadMapping.dPadRight, previous?.dPadRight || false);

      // Guardar estado anterior
      previousMappingRef.current = { ...gamepadMapping };
      lastUpdateRef.current = now;
    }, finalConfig.updateRate);

    return () => {
      clearInterval(updateInterval);
      activeMovementsRef.current.clear();
    };
  }, [
    finalConfig,
    gamepadConnected,
    isConnected,
    gamepadMapping,
    handleAnalogMovement,
    handleButtonPress,
  ]);

  return {
    isGamepadConnected: gamepadConnected,
    isControlEnabled: finalConfig.enabled && gamepadConnected && isConnected,
    config: finalConfig,
    mapping,
    currentGamepadState: gamepadMapping,
    gamepadState,
    forceDetection,
  };
}