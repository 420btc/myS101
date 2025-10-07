"use client";

import React from "react";
import { RiGamepadFill } from "@remixicon/react";
import GlassButton from "./GlassButton";

interface GamepadControlButtonProps {
  showControlPanel: boolean;
  onToggleControlPanel: () => void;
  isConnected?: boolean;
}

export default function GamepadControlButton({
  showControlPanel,
  onToggleControlPanel,
  isConnected = false,
}: GamepadControlButtonProps) {
  return (
    <GlassButton
      onClick={onToggleControlPanel}
      icon={<RiGamepadFill size={24} />}
      tooltip={isConnected ? "Joystick Xbox 360 conectado" : "Joystick Xbox 360 desconectado"}
      pressed={showControlPanel}
    />
  );
}