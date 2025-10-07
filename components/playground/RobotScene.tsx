"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import URDFLoader, { URDFRobot, URDFJoint } from "urdf-loader";
import { OrbitControls } from "@react-three/drei";
import { GroundPlane } from "./GroundPlane";
import { robotConfigMap } from "@/config/robotConfig";
import { JointState } from "@/hooks/useRobotControl";
import { degreesToRadians } from "@/lib/utils";

export type JointDetails = {
  name: string;
  servoId: number;
  limit: {
    lower?: number;
    upper?: number;
  };
  jointType: "revolute" | "continuous";
};

type RobotSceneProps = {
  robotName: string;
  urdfUrl: string;
  orbitTarget?: [number, number, number];
  setJointDetails: (details: JointDetails[]) => void;
  jointStates: JointState[];
  robotColor?: string;
};

export function RobotScene({
  robotName,
  urdfUrl,
  orbitTarget,
  setJointDetails,
  jointStates,
  robotColor,
}: RobotSceneProps) {
  const { scene } = useThree();
  const robotRef = useRef<URDFRobot | null>(null);

  useEffect(() => {
    const manager = new THREE.LoadingManager();
    const loader = new URDFLoader(manager);

    loader.load(
      urdfUrl,
      (robot) => {
        robotRef.current = robot;

        const details: JointDetails[] = robot.joints
          ? Object.values(robot.joints)
              .filter(
                (
                  joint
                ): joint is URDFJoint & {
                  jointType: "revolute" | "continuous";
                } =>
                  joint.jointType === "revolute" ||
                  joint.jointType === "continuous"
              )
              .map((joint) => ({
                name: joint.name,
                servoId: robotConfigMap[robotName]?.jointNameIdMap?.[joint.name] ?? 0,
                limit: {
                  lower:
                    joint.limit.lower === undefined
                      ? undefined
                      : Number(joint.limit.lower),
                  upper:
                    joint.limit.upper === undefined
                      ? undefined
                      : Number(joint.limit.upper),
                },
                jointType: joint.jointType,
              }))
          : [];
        setJointDetails(details);

        robot.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / -2);
        robot.traverse((c) => {
          c.castShadow = true;
        });
        robot.updateMatrixWorld(true);
        const scale = 15;
        robot.scale.set(scale, scale, scale);
        scene.add(robot);
      },
      undefined,
      (error) => console.error("Error loading URDF:", error)
    );
  }, [robotName, urdfUrl, setJointDetails]);

  // useEffect separado para manejar cambios de color
  useEffect(() => {
    if (robotRef.current && robotColor) {
      robotRef.current.traverse((c) => {
        if (c instanceof THREE.Mesh && c.material) {
          const material = c.material as THREE.MeshStandardMaterial;
          // Buscar materiales verdes por nombre o por valores RGB específicos
          if (material.name === 'green' || 
              (material.color && 
               Math.abs(material.color.r - 0.06) < 0.01 && 
               Math.abs(material.color.g - 0.4) < 0.01 && 
               Math.abs(material.color.b - 0.1) < 0.01)) {
            material.color.setHex(parseInt(robotColor.replace('#', '0x')));
            material.needsUpdate = true;
          }
        }
      });
    }
  }, [robotColor]);

  useFrame((state, delta) => {
    if (robotRef.current && robotRef.current.joints) {
      jointStates.forEach((state) => {
        const jointObj = robotRef.current!.joints[state.name];
        if (jointObj) {
          if (
            state.degrees !== undefined &&
            typeof state.degrees === "number" &&
            jointObj.jointType !== "continuous"
          ) {
            jointObj.setJointValue(degreesToRadians(state.degrees));
          } else if (
            state.speed !== undefined &&
            typeof state.speed === "number" &&
            jointObj.jointType === "continuous"
          ) {
            const currentAngle = Number(jointObj.angle) || 0;
            jointObj.setJointValue(currentAngle + (state.speed * delta) / 500);
          }
        }
      });
    }
  });

  return (
    <>
      <OrbitControls target={orbitTarget || [0, 0.1, 0.1]} />
      <GroundPlane />
      <directionalLight
        castShadow
        intensity={1}
        position={[2, 20, 5]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        intensity={1}
        position={[-2, 20, -5]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <ambientLight intensity={0.4} />
    </>
  );
}
