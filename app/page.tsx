"use client";

import { StarField } from "@/components/star-field";
import { robotConfigMap } from "@/config/robotConfig";
import { useState } from "react";
import PasswordDialog from "@/components/PasswordDialog";
import { useRouter } from "next/navigation";

import Link from "next/link";

export default function Home() {
  const [selectedRobot, setSelectedRobot] = useState<string | null>(null);
  const [showAllRobots, setShowAllRobots] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingPlayLink, setPendingPlayLink] = useState<string>("");
  const router = useRouter();

  const handleRobotSelect = (robotId: string) => {
    setSelectedRobot(robotId);
  };

  const handlePlayClick = (e: React.MouseEvent, playLink: string) => {
    e.preventDefault();
    setPendingPlayLink(playLink);
    setShowPasswordDialog(true);
  };

  const handlePasswordCorrect = () => {
    if (pendingPlayLink) {
      router.push(pendingPlayLink);
    }
  };

  const robots = Object.entries(robotConfigMap).map(([name, config]) => ({
    name,
    image: config.image,
    playLink: `/play/${name}`,
    assembleLink: config.assembleLink,
  }));

  // Separar so-arm100 del resto
  const soArm100 = robots.find(robot => robot.name === 'so-arm100');
  const otherRobots = robots.filter(robot => robot.name !== 'so-arm100');

  return (
    <main className="relative h-screen overflow-hidden">
      <div className="mt-16 mb-4 container mx-auto p-4 flex justify-center items-center relative z-10 h-full">
        <div className="text-center w-full">
          {" "}
          {/* Ensure text-center container takes full width */}
          <h1 className="text-8xl mb-4 font-bold font-bowlby-one text-shadow-lg">SO ARM 101 CPF</h1>
          <p className="text-xl mb-6">Tu viaje con robots comienza aquí...</p>
          {/* Changed from grid to flex for flexible centering */}
          <div className="container mx-auto p-4 flex flex-wrap justify-center gap-6 relative z-10">
            {/* Mostrar so-arm100 primero */}
            {soArm100 && (
              <div
                key={soArm100.name}
                className="rounded-2xl shadow-lg shadow-zinc-800 border border-zinc-500 overflow-hidden w-[90%] sm:w-[35%] lg:w-[22%]"
              >
                <div className="relative z-10">
                  <img
                    src={soArm100.image}
                    alt={soArm100.name}
                    className="w-full h-32 object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                </div>
                <h2 className="text-lg font-semibold -mt-6 ml-2 mb-3 text-left text-white relative z-20">
                  {soArm100.name === 'so-arm100' ? 'SO ARM 101' : soArm100.name}
                </h2>
                <div className="flex">
                  <button
                    onClick={(e) => handlePlayClick(e, soArm100.playLink)}
                    className={`bg-black text-white py-1.5 text-center hover:bg-zinc-800 border-t border-zinc-500 text-sm ${
                      soArm100.assembleLink ? "w-1/2 border-r" : "w-full"
                    }`}
                  >
                    Jugar
                  </button>
                  {soArm100.assembleLink && (
                    <Link
                      href={soArm100.assembleLink}
                      className="bg-black text-white w-1/2 py-1.5 text-center hover:bg-zinc-800 border-t border-zinc-500 text-sm"
                    >
                      Ensamblar
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Botón "Ver más..." */}
            {!showAllRobots && otherRobots.length > 0 && (
              <div className="rounded-2xl shadow-lg shadow-zinc-800 border border-zinc-500 overflow-hidden w-[90%] sm:w-[35%] lg:w-[22%] flex items-center justify-center bg-zinc-800/30 backdrop-blur-sm h-40">
                <button
                  onClick={() => setShowAllRobots(true)}
                  className="text-zinc-400 hover:text-white text-base font-medium transition-colors"
                >
                  Ver más...
                </button>
              </div>
            )}

            {/* Mostrar otros robots cuando showAllRobots es true */}
            {showAllRobots && otherRobots.map((robot) => (
              <div
                key={robot.name}
                className="rounded-2xl shadow-lg shadow-zinc-800 border border-zinc-500 overflow-hidden w-[90%] sm:w-[35%] lg:w-[22%]"
              >
                <div className="relative z-10">
                  <img
                    src={robot.image}
                    alt={robot.name}
                    className="w-full h-32 object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                </div>
                <h2 className="text-lg font-semibold -mt-6 ml-2 mb-3 text-left text-white relative z-20">
                  {robot.name}
                </h2>
                <div className="flex">
                  <button
                    onClick={(e) => handlePlayClick(e, robot.playLink)}
                    className={`bg-black text-white py-1.5 text-center hover:bg-zinc-800 border-t border-zinc-500 text-sm ${
                      robot.assembleLink ? "w-1/2 border-r" : "w-full"
                    }`}
                  >
                    Jugar
                  </button>
                  {robot.assembleLink && (
                    <Link
                      href={robot.assembleLink}
                      className="bg-black text-white w-1/2 py-1.5 text-center hover:bg-zinc-800 border-t border-zinc-500 text-sm"
                    >
                      Ensamblar
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" style={{ overflow: "hidden" }}>
        <StarField />
      </div>
      
      {/* Diálogo de contraseña */}
      <PasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onPasswordCorrect={handlePasswordCorrect}
      />
    </main>
  );
}
