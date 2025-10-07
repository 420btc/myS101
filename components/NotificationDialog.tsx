"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export function NotificationDialog({
  open,
  onOpenChange,
  onClose,
}: NotificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-800 border-zinc-600 text-white">
        <DialogHeader>
          <DialogTitle className="text-white border-b border-zinc-600 pb-4">
            Notificación Importante
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-zinc-300">
          <p>
            Al conectar a un robot real, hemos cambiado de reflejar cambios de ángulo
            a reflejar directamente los ángulos para un control más fácil y preciso.
          </p>
          <p className="text-red-400 font-semibold">
            Esto significa que si estás usando una versión anterior de so-arm100, necesitas
            recalibrarlo siguiendo{" "}
            <Link
              href="https://huggingface.co/docs/lerobot/so101#calibrate"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              esta guía
            </Link>
            .
          </p>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={onClose}
            className="bg-zinc-700 hover:bg-zinc-600 text-white w-full"
          >
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
