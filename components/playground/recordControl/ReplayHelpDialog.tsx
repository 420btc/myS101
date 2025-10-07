import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ReplayHelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="text-white bg-zinc-700 hover:bg-zinc-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold p-2"
          title="Ayuda"
        >
          ?
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-zinc-800 border-zinc-600 text-white">
        <DialogHeader>
          <DialogTitle className="text-white border-b border-zinc-600 pb-4">
            Instrucciones de Reproducción
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="font-semibold mb-2 text-yellow-400">
              Consejos de seguridad:
            </div>
            <ul className="list-disc list-inside space-y-1 text-zinc-300">
              <li>
                Antes de reproducir en el robot seguidor, reprodúcelo virtualmente
                primero.
              </li>
              <li>
                Asegúrate de que la posición inicial del seguidor esté cerca de la
                posición inicial de la reproducción.
              </li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="secondary"
              className="bg-zinc-700 hover:bg-zinc-600 text-white"
            >
              Entendido
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
