"use client";

import React from "react";
import { Rnd } from "react-rnd";
import { Button } from "@/components/ui/button";
import { panelStyle } from "@/components/playground/panelStyle";
import { RiCloseFill } from "@remixicon/react";

interface BackgroundControlProps {
  show: boolean;
  onHide: () => void;
  currentColor: number;
  onColorChange: (color: number) => void;
}

const colorOptions = [
  { name: "Gris Oscuro", value: 0x263238, color: "#263238" },
  { name: "Blanco", value: 0xffffff, color: "#ffffff" },
  { name: "Negro", value: 0x000000, color: "#000000" },
  { name: "Azul Claro", value: 0x87ceeb, color: "#87ceeb" },
  { name: "Verde Claro", value: 0x90ee90, color: "#90ee90" },
  { name: "Beige", value: 0xf5f5dc, color: "#f5f5dc" },
  { name: "Gris Claro", value: 0xd3d3d3, color: "#d3d3d3" },
  { name: "Azul Oscuro", value: 0x1e3a8a, color: "#1e3a8a" },
];

export function BackgroundControl({ 
  show, 
  onHide, 
  currentColor, 
  onColorChange 
}: BackgroundControlProps) {
  if (!show) return null;

  return (
    <Rnd
      default={{
        x: window.innerWidth - 320,
        y: 100,
        width: 280,
        height: "auto",
      }}
      minWidth={280}
      minHeight={200}
      bounds="window"
      dragHandleClassName="drag-handle"
    >
      <div className={panelStyle}>
        {/* Header with close button */}
        <div className="flex justify-between items-center mb-4 drag-handle cursor-move">
          <h3 className="text-lg font-semibold text-white">Color de Fondo 3D</h3>
          <Button
            onClick={onHide}
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10 p-1"
          >
            <RiCloseFill size={20} />
          </Button>
        </div>

        {/* Color selector grid */}
        <div className="grid grid-cols-4 gap-3">
          {colorOptions.map((option) => (
            <Button
              key={option.value}
              onClick={() => onColorChange(option.value)}
              className={`
                w-16 h-16 p-0 rounded-lg border-2 transition-all duration-200
                ${currentColor === option.value 
                  ? 'border-white/80 scale-110 shadow-lg' 
                  : 'border-white/30 hover:border-white/60 hover:scale-105'
                }
              `}
              style={{ backgroundColor: option.color }}
              title={option.name}
            />
          ))}
        </div>

        {/* Current color info */}
        <div className="mt-4 text-center">
          <p className="text-sm text-white/70">
            Color actual: {colorOptions.find(c => c.value === currentColor)?.name || "Personalizado"}
          </p>
        </div>
      </div>
    </Rnd>
  );
}