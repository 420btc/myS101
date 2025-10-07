"use client";

import { Canvas } from "@react-three/fiber";
import { robotConfigMap } from "@/config/robotConfig";
import { RobotScene, JointDetails } from "@/components/playground/RobotScene";
import { useState, useEffect } from "react";
import { JointState } from "@/hooks/useRobotControl";

export default function RobotPreview() {
  const robotName = "so-arm100";
  const robotConfig = robotConfigMap[robotName];
  const [jointDetails, setJointDetails] = useState<JointDetails[]>([]);
  const [jointStates, setJointStates] = useState<JointState[]>([]);
  const [robotColor, setRobotColor] = useState<string>("#0a6619"); // Color verde por defecto

  useEffect(() => {
    if (jointDetails.length > 0) {
      const initialJointStates = jointDetails.map((detail) => {
        const initialAngle =
          robotConfig.urdfInitJointAngles?.[detail.name] ?? 0;
        return {
          name: detail.name,
          servoId: detail.servoId,
          jointType: detail.jointType,
          limit: detail.limit,
          degrees: initialAngle,
        };
      });
      setJointStates(initialJointStates);
    }
  }, [jointDetails, robotConfig.urdfInitJointAngles]);

  return (
    <div className="space-y-4">
      {/* Selector de color */}
      <div className="flex items-center gap-4 p-4 bg-zinc-800 rounded-lg">
        <label htmlFor="color-picker" className="text-white font-medium">
          Color del brazo:
        </label>
        <input
          id="color-picker"
          type="color"
          value={robotColor}
          onChange={(e) => setRobotColor(e.target.value)}
          className="w-12 h-8 rounded border border-zinc-600 cursor-pointer"
        />
        <span className="text-zinc-400 text-sm">{robotColor}</span>
      </div>

      {/* Vista previa del robot */}
      <div className="w-full h-96 rounded-lg overflow-hidden border border-zinc-600">
        <Canvas
          shadows
          frameloop="always"
          gl={{ 
            antialias: true,
            powerPreference: "high-performance",
            alpha: false
          }}
          camera={{
            position: robotConfig.camera.position as [number, number, number],
            fov: robotConfig.camera.fov,
          }}
        >
          <RobotScene
            robotName={robotName}
            urdfUrl={robotConfig.urdfUrl}
            orbitTarget={robotConfig.orbitTarget}
            setJointDetails={setJointDetails}
            jointStates={jointStates}
            robotColor={robotColor}
          />
        </Canvas>
      </div>
    </div>
  );
}
