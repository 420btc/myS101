import GlassButton from "./GlassButton";
import { RiPaintBrushFill } from "@remixicon/react";

interface RobotColorControlButtonProps {
  showControlPanel: boolean;
  onToggleControlPanel: () => void;
}

export default function RobotColorControlButton({
  showControlPanel,
  onToggleControlPanel,
}: RobotColorControlButtonProps) {
  return (
    <GlassButton
      onClick={onToggleControlPanel}
      icon={<RiPaintBrushFill size={24} />}
      tooltip="Color del Robot"
      pressed={showControlPanel}
    />
  );
}