"use client";

import React from "react";
import { Rnd } from "react-rnd";
import { Button } from "@/components/ui/button";
import { panelStyle } from "@/components/playground/panelStyle";
import { RiCloseFill } from "@remixicon/react";

interface RobotColorControlProps {
  show: boolean;
  onHide: () => void;
  currentColor: string;
  onColorChange: (color: string) => void;
}

const colorOptions = [
  { name: "Verde Original", value: "#0a6619", color: "#0a6619" },
  { name: "Azul", value: "#1e40af", color: "#1e40af" },
  { name: "Rojo", value: "#dc2626", color: "#dc2626" },
  { name: "Naranja", value: "#ea580c", color: "#ea580c" },
  { name: "Morado", value: "#7c3aed", color: "#7c3aed" },
  { name: "Rosa", value: "#e11d48", color: "#e11d48" },
  { name: "Amarillo", value: "#ca8a04", color: "#ca8a04" },
  { name: "Cian", value: "#0891b2", color: "#0891b2" },
  { name: "Gris", value: "#6b7280", color: "#6b7280" },
  { name: "Negro", value: "#1f2937", color: "#1f2937" },
  { name: "Blanco", value: "#f9fafb", color: "#f9fafb" },
  { name: "Dorado", value: "#d97706", color: "#d97706" },
];

export function RobotColorControl({ 
  show, 
  onHide, 
  currentColor, 
  onColorChange 
}: RobotColorControlProps) {
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
          <h3 className="text-lg font-semibold text-white">Color del Robot</h3>
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

        {/* Custom color picker */}
        <div className="mt-4">
          <label className="block text-sm text-white/70 mb-2">Color personalizado:</label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-12 h-8 rounded border border-white/30 bg-transparent cursor-pointer"
            />
            <span className="text-sm text-white/70 font-mono">
              {currentColor.toUpperCase()}
            </span>
          </div>
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