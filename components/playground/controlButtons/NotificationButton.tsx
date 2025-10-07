import GlassButton from "./GlassButton";
import { RiNotification2Line } from "@remixicon/react";

interface NotificationButtonProps {
  onClick: () => void;
  hasNew: boolean;
}

export default function NotificationButton({
  onClick,
  hasNew,
}: NotificationButtonProps) {
  return (
    <GlassButton
      onClick={onClick}
      icon={
        <div className="relative">
          <RiNotification2Line size={24} />
          {hasNew && (
            <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-zinc-800" />
          )}
        </div>
      }
      tooltip="Notificaciones"
      pressed={false}
    />
  );
}