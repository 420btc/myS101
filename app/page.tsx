"use client";

import { StarField } from "@/components/star-field";
import { robotConfigMap } from "@/config/robotConfig";
import { useState } from "react";

import Link from "next/link";

export default function Home() {
  const [selectedRobot, setSelectedRobot] = useState<string | null>(null);
  const [showAllRobots, setShowAllRobots] = useState(false);

  const handleRobotSelect = (robotId: string) => {
    setSelectedRobot(robotId);
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
    <main className="relative">
      <div className="mt-32 mb-4 container mx-auto p-4 flex justify-center items-center relative z-10">
        <div className="text-center w-full">
          {" "}
          {/* Ensure text-center container takes full width */}
          <h1 className="text-6xl mb-4 font-bold font-bowlby-one text-shadow-lg">SO ARM 101 CPF</h1>
          <p className="text-2xl mb-8"> </p>
          {/* Changed from grid to flex for flexible centering */}
          <div className="container mx-auto p-4 flex flex-wrap justify-center gap-8 relative z-10">
            {/* Mostrar so-arm100 primero */}
            {soArm100 && (
              <div
                key={soArm100.name}
                className="rounded-2xl shadow-lg  shadow-zinc-800 border border-zinc-500 overflow-hidden w-[90%] sm:w-[40%] lg:w-[25%]"
              >
                <div className="relative z-10">
                  <img
                    src={soArm100.image}
                    alt={soArm100.name}
                    className="w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                </div>
                <h2 className="text-xl font-semibold -mt-8 ml-2 mb-4 text-left text-white relative z-20">
                  {soArm100.name === 'so-arm100' ? 'SO ARM 101' : soArm100.name}
                </h2>
                <div className="flex">
                  <Link
                    href={soArm100.playLink}
                    className={`bg-black text-white py-2 text-center hover:bg-zinc-800 border-t border-zinc-500 ${
                      soArm100.assembleLink ? "w-1/2 border-r" : "w-full"
                    }`}
                  >
                    Jugar
                  </Link>
                  {soArm100.assembleLink && (
                    <Link
                      href={soArm100.assembleLink}
                      className="bg-black text-white w-1/2 py-2 text-center hover:bg-zinc-800 border-t border-zinc-500"
                    >
                      Ensamblar
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Botón "Ver más..." */}
            {!showAllRobots && otherRobots.length > 0 && (
              <div className="rounded-2xl shadow-lg shadow-zinc-800 border border-zinc-500 overflow-hidden w-[90%] sm:w-[40%] lg:w-[25%] flex items-center justify-center bg-zinc-800/30 backdrop-blur-sm">
                <button
                  onClick={() => setShowAllRobots(true)}
                  className="text-zinc-400 hover:text-white text-lg font-medium transition-colors py-8"
                >
                  Ver más...
                </button>
              </div>
            )}

            {/* Mostrar otros robots cuando showAllRobots es true */}
            {showAllRobots && otherRobots.map((robot) => (
              <div
                key={robot.name}
                className="rounded-2xl shadow-lg  shadow-zinc-800 border border-zinc-500 overflow-hidden w-[90%] sm:w-[40%] lg:w-[25%]"
              >
                <div className="relative z-10">
                  <img
                    src={robot.image}
                    alt={robot.name}
                    className="w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                </div>
                <h2 className="text-xl font-semibold -mt-8 ml-2 mb-4 text-left text-white relative z-20">
                  {robot.name}
                </h2>
                <div className="flex">
                  <Link
                    href={robot.playLink}
                    className={`bg-black text-white py-2 text-center hover:bg-zinc-800 border-t border-zinc-500 ${
                      robot.assembleLink ? "w-1/2 border-r" : "w-full"
                    }`}
                  >
                    Jugar
                  </Link>
                  {robot.assembleLink && (
                    <Link
                      href={robot.assembleLink}
                      className="bg-black text-white w-1/2 py-2 text-center hover:bg-zinc-800 border-t border-zinc-500"
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
    </main>
  );
}
