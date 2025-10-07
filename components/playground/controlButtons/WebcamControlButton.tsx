"use client";

import { Camera } from "lucide-react";
import GlassButton from "./GlassButton";

interface WebcamControlButtonProps {
  showWebcam: boolean;
  onToggleWebcam: () => void;
}

export default function WebcamControlButton({
  showWebcam,
  onToggleWebcam,
}: WebcamControlButtonProps) {
  return (
    <GlassButton
      icon={<Camera className="w-5 h-5" />}
      tooltip="Webcam"
      onClick={onToggleWebcam}
      pressed={showWebcam}
    />
  );
}