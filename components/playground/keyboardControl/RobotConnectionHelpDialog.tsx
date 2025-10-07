import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function RobotConnectionHelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="text-white bg-zinc-700 hover:bg-zinc-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
          title="Ayuda"
        >
          ?
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-zinc-800 border-zinc-600 text-white">
        <DialogHeader>
          <DialogTitle className="text-white border-b border-zinc-600 pb-4">
            Conectando al Robot Seguidor
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* <div>
            <div className="font-semibold mb-2">Before connecting:</div>
            <ul className="list-disc list-inside space-y-1 text-zinc-300">
              <li className="text-red-400 font-semibold">
                Ensure your physical robot's position matches the virtual
                robot's position
              </li>
              <li>Power on your robot</li>
              <li>Select the correct serial device when prompted</li>
            </ul>
          </div> */}
                    <div>
            <div className="font-semibold mb-2">Cómo funciona:</div>
            <ul className="list-disc list-inside space-y-1 text-zinc-300">
              {/* <li>The joints of the follower robot will mirror the positions of the virtual robot</li> */}
              <li>Las posiciones de los servos se reflejan en tiempo real</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2 text-yellow-400">
              Consejos de seguridad:
            </div>
            <ul className="list-disc list-inside space-y-1 text-zinc-300">
                <li>No muevas el robot seguidor manualmente; el torque está habilitado y esto puede dañar los servos.</li>
              <li>Usa velocidades más lentas al conectar por primera vez</li>
              <li>Desconecta inmediatamente si ocurre un comportamiento inesperado</li>
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
