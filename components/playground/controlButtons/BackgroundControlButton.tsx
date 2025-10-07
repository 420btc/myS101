import GlassButton from "./GlassButton";
import { RiPaletteFill } from "@remixicon/react";

interface BackgroundControlButtonProps {
  showControlPanel: boolean;
  onToggleControlPanel: () => void;
}

export default function BackgroundControlButton({
  showControlPanel,
  onToggleControlPanel,
}: BackgroundControlButtonProps) {
  return (
    <GlassButton
      onClick={onToggleControlPanel}
      icon={<RiPaletteFill size={24} />}
      tooltip="Color de Fondo"
      pressed={showControlPanel}
    />
  );
}