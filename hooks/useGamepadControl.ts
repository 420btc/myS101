"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export interface GamepadState {
  connected: boolean;
  gamepadIndex: number | null;
  axes: number[];
  buttons: boolean[];
  timestamp: number;
}

export interface GamepadMapping {
  leftStickX: number;    // Eje 0 - Stick izquierdo horizontal
  leftStickY: number;    // Eje 1 - Stick izquierdo vertical
  rightStickX: number;   // Eje 2 - Stick derecho horizontal
  rightStickY: number;   // Eje 3 - Stick derecho vertical
  leftTrigger: number;   // Eje 4 - Gatillo izquierdo
  rightTrigger: number;  // Eje 5 - Gatillo derecho
  
  // Botones Xbox 360
  buttonA: boolean;      // Botón 0
  buttonB: boolean;      // Botón 1
  buttonX: boolean;      // Botón 2
  buttonY: boolean;      // Botón 3
  leftBumper: boolean;   // Botón 4
  rightBumper: boolean;  // Botón 5
  back: boolean;         // Botón 6
  start: boolean;        // Botón 7
  leftStickButton: boolean;  // Botón 8
  rightStickButton: boolean; // Botón 9
  dPadUp: boolean;       // Botón 10
  dPadDown: boolean;     // Botón 11
  dPadLeft: boolean;     // Botón 12
  dPadRight: boolean;    // Botón 13
}

export function useGamepadControl(deadZone: number = 0.15) {
  const [gamepadState, setGamepadState] = useState<GamepadState>({
    connected: false,
    gamepadIndex: null,
    axes: [],
    buttons: [],
    timestamp: 0,
  });

  const [gamepadMapping, setGamepadMapping] = useState<GamepadMapping>({
    leftStickX: 0,
    leftStickY: 0,
    rightStickX: 0,
    rightStickY: 0,
    leftTrigger: 0,
    rightTrigger: 0,
    buttonA: false,
    buttonB: false,
    buttonX: false,
    buttonY: false,
    leftBumper: false,
    rightBumper: false,
    back: false,
    start: false,
    leftStickButton: false,
    rightStickButton: false,
    dPadUp: false,
    dPadDown: false,
    dPadLeft: false,
    dPadRight: false,
  });

  const animationFrameRef = useRef<number | null>(null);

  // Función para aplicar zona muerta a los ejes analógicos
  const applyDeadZone = useCallback((value: number, deadZone: number): number => {
    if (Math.abs(value) < deadZone) {
      return 0;
    }
    // Normalizar el valor fuera de la zona muerta
    const sign = value > 0 ? 1 : -1;
    return sign * ((Math.abs(value) - deadZone) / (1 - deadZone));
  }, []);

  // Función para detectar y conectar gamepads
  const detectGamepads = useCallback((forceLog = false) => {
    if (!navigator.getGamepads) {
      console.warn('Gamepad API no está disponible en este navegador');
      return;
    }

    const gamepads = navigator.getGamepads();
    let connectedGamepad: Gamepad | null = null;
    let gamepadIndex: number | null = null;

    // Solo hacer logs si se fuerza (detección manual) o si hay cambios
    if (forceLog) {
      console.log('Gamepads detectados:', gamepads.length);
      
      for (let i = 0; i < gamepads.length; i++) {
        const gamepad = gamepads[i];
        
        if (gamepad && gamepad.id) {
          console.log(`Gamepad ${i} conectado:`, gamepad.id);
        } else if (gamepad === null) {
          console.log(`Gamepad ${i}: null`);
        }
      }
      
      // Información para receptores inalámbricos
      const nullSlots = Array.from(gamepads).filter(g => g === null).length;
      if (nullSlots === gamepads.length && gamepads.length > 0) {
        console.log('Todos los slots vacíos - receptor inalámbrico sin sincronizar');
      }
    }

    // Buscar el primer gamepad conectado (preferiblemente Xbox 360)
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (gamepad && gamepad.connected && gamepad.id) {
        if (forceLog) console.log(`Gamepad conectado encontrado: ${gamepad.id}`);
        // Priorizar controladores Xbox
        if (gamepad.id.toLowerCase().includes('xbox') || 
            gamepad.id.toLowerCase().includes('360') ||
            gamepad.id.toLowerCase().includes('xinput') ||
            gamepad.id.toLowerCase().includes('microsoft')) {
          connectedGamepad = gamepad;
          gamepadIndex = i;
          if (forceLog) console.log(`Xbox controller seleccionado: ${gamepad.id}`);
          break;
        } else if (!connectedGamepad) {
          // Usar cualquier gamepad si no hay Xbox disponible
          connectedGamepad = gamepad;
          gamepadIndex = i;
          if (forceLog) console.log(`Gamepad genérico seleccionado: ${gamepad.id}`);
        }
      }
    }

    if (connectedGamepad && gamepadIndex !== null) {
      if (forceLog) console.log(`Gamepad activo: ${connectedGamepad.id} (índice: ${gamepadIndex})`);
      // Actualizar estado del gamepad
      setGamepadState({
        connected: true,
        gamepadIndex,
        axes: Array.from(connectedGamepad.axes),
        buttons: connectedGamepad.buttons.map(button => button.pressed),
        timestamp: connectedGamepad.timestamp,
      });

      // Mapear controles específicos del Xbox 360
      setGamepadMapping({
        leftStickX: applyDeadZone(connectedGamepad.axes[0] || 0, deadZone),
        leftStickY: applyDeadZone(connectedGamepad.axes[1] || 0, deadZone),
        rightStickX: applyDeadZone(connectedGamepad.axes[2] || 0, deadZone),
        rightStickY: applyDeadZone(connectedGamepad.axes[3] || 0, deadZone),
        leftTrigger: connectedGamepad.axes[4] || 0,
        rightTrigger: connectedGamepad.axes[5] || 0,
        
        buttonA: connectedGamepad.buttons[0]?.pressed || false,
        buttonB: connectedGamepad.buttons[1]?.pressed || false,
        buttonX: connectedGamepad.buttons[2]?.pressed || false,
        buttonY: connectedGamepad.buttons[3]?.pressed || false,
        leftBumper: connectedGamepad.buttons[4]?.pressed || false,
        rightBumper: connectedGamepad.buttons[5]?.pressed || false,
        back: connectedGamepad.buttons[6]?.pressed || false,
        start: connectedGamepad.buttons[7]?.pressed || false,
        leftStickButton: connectedGamepad.buttons[8]?.pressed || false,
        rightStickButton: connectedGamepad.buttons[9]?.pressed || false,
        dPadUp: connectedGamepad.buttons[10]?.pressed || false,
        dPadDown: connectedGamepad.buttons[11]?.pressed || false,
        dPadLeft: connectedGamepad.buttons[12]?.pressed || false,
        dPadRight: connectedGamepad.buttons[13]?.pressed || false,
      });
    } else {
      // No hay gamepad conectado - solo log en detección manual
      setGamepadState({
        connected: false,
        gamepadIndex: null,
        axes: [],
        buttons: [],
        timestamp: 0,
      });
    }
  }, [applyDeadZone, deadZone]);

  // Loop de actualización del gamepad
  const updateGamepad = useCallback(() => {
    detectGamepads();
    animationFrameRef.current = requestAnimationFrame(updateGamepad);
  }, [detectGamepads]);

  // Event listeners para conexión/desconexión de gamepads
  useEffect(() => {
    const handleGamepadConnected = (event: GamepadEvent) => {
      if (event.gamepad && event.gamepad.id) {
        console.log(`Gamepad conectado: ${event.gamepad.id}`);
      }
      // Forzar detección inmediata
      setTimeout(() => detectGamepads(), 100);
    };

    const handleGamepadDisconnected = (event: GamepadEvent) => {
      if (event.gamepad && event.gamepad.id) {
        console.log(`Gamepad desconectado: ${event.gamepad.id}`);
      }
      // Forzar detección inmediata
      setTimeout(() => detectGamepads(), 100);
    };

    // Función para detectar gamepads de forma periódica (útil para receptores inalámbricos)
    const periodicDetection = () => {
      // Solo hacer detección periódica si no hay gamepads conectados
      if (!gamepadState.connected) {
        detectGamepads();
      }
    };

    // Agregar event listeners
    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    // Detección periódica cada 10 segundos para receptores inalámbricos
    const periodicInterval = setInterval(periodicDetection, 10000);

    // Iniciar el loop de actualización
    updateGamepad();

    // Cleanup
    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
      clearInterval(periodicInterval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [detectGamepads, updateGamepad, gamepadState.connected]);

  // Función para obtener información del gamepad
  const getGamepadInfo = useCallback(() => {
    if (!gamepadState.connected || gamepadState.gamepadIndex === null) {
      return null;
    }

    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[gamepadState.gamepadIndex];
    
    return gamepad ? {
      id: gamepad.id,
      index: gamepad.index,
      connected: gamepad.connected,
      mapping: gamepad.mapping,
      timestamp: gamepad.timestamp,
    } : null;
  }, [gamepadState]);

  return {
    gamepadState,
    gamepadMapping,
    getGamepadInfo,
    isConnected: gamepadState.connected,
    forceDetection: () => detectGamepads(true),
  };
}