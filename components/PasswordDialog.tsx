"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RiLockFill, RiEyeFill, RiEyeOffFill } from "@remixicon/react";

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPasswordCorrect: () => void;
}

export default function PasswordDialog({
  open,
  onOpenChange,
  onPasswordCorrect,
}: PasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const correctPassword = "free420";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simular un pequeño delay para mejor UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (password === correctPassword) {
      setPassword("");
      setError("");
      onPasswordCorrect();
      onOpenChange(false);
    } else {
      setError("Contraseña incorrecta. Inténtalo de nuevo.");
    }
    
    setIsLoading(false);
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-700 text-white">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600/20 rounded-full">
              <RiLockFill className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Acceso Restringido
              </h2>
              <DialogDescription className="text-zinc-400 mt-1">
                Ingresa la contraseña para acceder al control del brazo robótico
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white font-medium">
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la contraseña"
                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500 pr-10"
                disabled={isLoading}
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-700"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <RiEyeOffFill className="w-4 h-4" />
                ) : (
                  <RiEyeFill className="w-4 h-4" />
                )}
              </Button>
            </div>
            {error && (
              <p className="text-red-400 text-sm flex items-center gap-2">
                <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="bg-transparent border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verificando...
                </div>
              ) : (
                "Acceder"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}