"use client";

import React from "react";
import { Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";
import GlassButton from "./GlassButton";

type WASDControlButtonProps = {
  showControlPanel: boolean;
  onToggleControlPanel: () => void;
};

export function WASDControlButton({ showControlPanel, onToggleControlPanel }: WASDControlButtonProps) {
  // Crear el ícono WASD personalizado
  const wasdIcon = (
    <div className="flex flex-col items-center justify-center">
      {/* Icono WASD */}
      <div className="grid grid-cols-3 gap-0.5 mb-1">
        <div></div>
        <div className="w-2 h-2 bg-current rounded-sm opacity-80"></div>
        <div></div>
        <div className="w-2 h-2 bg-current rounded-sm opacity-80"></div>
        <div className="w-2 h-2 bg-current rounded-sm opacity-80"></div>
        <div className="w-2 h-2 bg-current rounded-sm opacity-80"></div>
      </div>
      {/* Texto WASD */}
      <div className="text-xs font-bold opacity-90">WASD</div>
    </div>
  );

  return (
    <GlassButton
      icon={wasdIcon}
      tooltip="Control WQSD/ZXCV/1234"
      onClick={onToggleControlPanel}
      pressed={showControlPanel}
    />
  );
}