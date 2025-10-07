"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { robotConfigMap } from "@/config/robotConfig";
import * as THREE from "three";
import { Html, useProgress } from "@react-three/drei";
import { ControlPanel } from "./keyboardControl/KeyboardControl";
import { useRobotControl } from "@/hooks/useRobotControl";
import { Canvas, useThree } from "@react-three/fiber";
import { ChatControl } from "./chatControl/ChatControl";
import LeaderControl from "../playground/leaderControl/LeaderControl";
import { useLeaderRobotControl } from "@/hooks/useLeaderRobotControl";
import { RobotScene } from "./RobotScene";
import KeyboardControlButton from "../playground/controlButtons/KeyboardControlButton";
import ChatControlButton from "../playground/controlButtons/ChatControlButton";
import LeaderControlButton from "../playground/controlButtons/LeaderControlButton";
import RecordButton from "./controlButtons/RecordButton";
import NotificationButton from "./controlButtons/NotificationButton";
import RecordControl from "./recordControl/RecordControl";
import { NotificationDialog } from "@/components/NotificationDialog";
import {
  getPanelStateFromLocalStorage,
  setPanelStateToLocalStorage,
} from "@/lib/panelSettings";
import { SceneBackground } from "./SceneBackground";
import BackgroundControlButton from "./controlButtons/BackgroundControlButton";
import { BackgroundControl } from "./backgroundControl/BackgroundControl";
import RobotColorControlButton from "./controlButtons/RobotColorControlButton";
import { RobotColorControl } from "./robotColorControl/RobotColorControl";
import GamepadControlButton from "./controlButtons/GamepadControlButton";
import { GamepadControl } from "../GamepadControl";
import { useGamepadRobotControl, GamepadControlConfig } from "@/hooks/useGamepadRobotControl";
import { WASDControlButton } from "./controlButtons/WASDControlButton";
import { WASDControl } from "./wasdControl/WASDControl";

export type JointDetails = {
  name: string;
  servoId: number;
  limit: {
    lower?: number;
    upper?: number;
  };
  jointType: "revolute" | "continuous";
};

type RobotLoaderProps = {
  robotName: string;
};

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center className="text-4xl text-white">
      {progress} % loaded
    </Html>
  );
}

export default function RobotLoader({ robotName }: RobotLoaderProps) {
  const [jointDetails, setJointDetails] = useState<JointDetails[]>([]);
  const [backgroundColor, setBackgroundColor] = useState<number>(0x263238);
  const [robotColor, setRobotColor] = useState<string>("#0a6619"); // Color verde original
  const [showControlPanel, setShowControlPanel] = useState(() => {
    const stored = getPanelStateFromLocalStorage("keyboardControl", robotName);
    return stored !== null ? stored : false;
  });
  const [showLeaderControl, setShowLeaderControl] = useState(() => {
    return getPanelStateFromLocalStorage("leaderControl", robotName) ?? false;
  });
  const [showChatControl, setShowChatControl] = useState(() => {
    return getPanelStateFromLocalStorage("chatControl", robotName) ?? false;
  });
  const [showRecordControl, setShowRecordControl] = useState(() => {
    return getPanelStateFromLocalStorage("recordControl", robotName) ?? false;
  });
  const [showBackgroundControl, setShowBackgroundControl] = useState(() => {
    return getPanelStateFromLocalStorage("backgroundControl", robotName) ?? false;
  });
  const [showGamepadControl, setShowGamepadControl] = useState(() => {
    return getPanelStateFromLocalStorage("gamepadControl", robotName) ?? false;
  });
  const [showRobotColorControl, setShowRobotColorControl] = useState(() => {
    return getPanelStateFromLocalStorage("robotColorControl", robotName) ?? false;
  });
  const [showWASDControl, setShowWASDControl] = useState(() => {
    return getPanelStateFromLocalStorage("wasdControl", robotName) ?? false;
  });
  
  // Gamepad configuration state
  const [gamepadConfig, setGamepadConfig] = useState<GamepadControlConfig>({
    enabled: true,
    sensitivity: 1.0,
    deadZone: 0.15,
    updateRate: 50,
    speedModifier: {
      slow: 0.3,
      normal: 1.0,
      fast: 1.8,
    },
  });
  
  // Notification states
  const [showNotification, setShowNotification] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const NOTIFICATION_KEY = "bambot-update-2024-05";

  useEffect(() => {
    if (!localStorage.getItem(NOTIFICATION_KEY)) {
      setHasNew(true);
    }
  }, []);

  const config = robotConfigMap[robotName];

  // Get leader robot servo IDs (exclude continuous joint types)
  const leaderServoIds = jointDetails
    .filter((j) => j.jointType !== "continuous")
    .map((j) => j.servoId);

  // Initialize leader robot control hook
  const leaderControl = useLeaderRobotControl(leaderServoIds);

  if (!config) {
    throw new Error(`Robot configuration for "${robotName}" not found.`);
  }

  const {
    urdfUrl,
    orbitTarget,
    camera,
    keyboardControlMap,
    compoundMovements,
    systemPrompt,
    urdfInitJointAngles,
  } = config;

  const {
    isConnected,
    connectRobot,
    disconnectRobot,
    jointStates,
    updateJointSpeed,
    setJointDetails: updateJointDetails,
    updateJointDegrees,
    updateJointsDegrees,
    updateJointsSpeed,
    isRecording,
    recordData,
    startRecording,
    stopRecording,
    clearRecordData,
  } = useRobotControl(jointDetails, urdfInitJointAngles);

  // Initialize gamepad robot control
  const gamepadControl = useGamepadRobotControl(
    updateJointDegrees,
    updateJointsSpeed,
    isConnected,
    gamepadConfig,
    updateJointsDegrees
  );

  useEffect(() => {
    updateJointDetails(jointDetails);
  }, [jointDetails, updateJointDetails]);

  // Functions to handle panel state changes and localStorage updates
  const toggleControlPanel = () => {
    setShowControlPanel((prev) => {
      const newState = !prev;
      setPanelStateToLocalStorage("keyboardControl", newState, robotName);
      return newState;
    });
  };

  const toggleLeaderControl = () => {
    setShowLeaderControl((prev) => {
      const newState = !prev;
      setPanelStateToLocalStorage("leaderControl", newState, robotName);
      return newState;
    });
  };

  const toggleChatControl = () => {
    setShowChatControl((prev) => {
      const newState = !prev;
      setPanelStateToLocalStorage("chatControl", newState, robotName);
      return newState;
    });
  };

  const toggleRecordControl = () => {
    setShowRecordControl((prev) => {
      const newState = !prev;
      setPanelStateToLocalStorage("recordControl", newState, robotName);
      return newState;
    });
  };

  const toggleBackgroundControl = () => {
    setShowBackgroundControl((prev) => {
      const newState = !prev;
      setPanelStateToLocalStorage("backgroundControl", newState, robotName);
      return newState;
    });
  };

  const toggleGamepadControl = () => {
    setShowGamepadControl((prev) => {
      const newState = !prev;
      setPanelStateToLocalStorage("gamepadControl", newState, robotName);
      return newState;
    });
  };

  const toggleRobotColorControl = () => {
    setShowRobotColorControl((prev) => {
      const newState = !prev;
      setPanelStateToLocalStorage("robotColorControl", newState, robotName);
      return newState;
    });
  };

  const toggleWASDControl = () => {
    setShowWASDControl((prev) => {
      const newState = !prev;
      setPanelStateToLocalStorage("wasdControl", newState, robotName);
      return newState;
    });
  };

  const hideControlPanel = () => {
    setShowControlPanel(false);
    setPanelStateToLocalStorage("keyboardControl", false, robotName);
  };

  const hideLeaderControl = () => {
    setShowLeaderControl(false);
    setPanelStateToLocalStorage("leaderControl", false, robotName);
  };

  const hideChatControl = () => {
    setShowChatControl(false);
    setPanelStateToLocalStorage("chatControl", false, robotName);
  };

  const hideRecordControl = () => {
    setShowRecordControl(false);
    setPanelStateToLocalStorage("recordControl", false, robotName);
  };

  const hideBackgroundControl = () => {
    setShowBackgroundControl(false);
    setPanelStateToLocalStorage("backgroundControl", false, robotName);
  };

  const hideGamepadControl = () => {
    setShowGamepadControl(false);
    setPanelStateToLocalStorage("gamepadControl", false, robotName);
  };

  const hideRobotColorControl = () => {
    setShowRobotColorControl(false);
    setPanelStateToLocalStorage("robotColorControl", false, robotName);
  };

  // Notification functions
  const handleBellClick = () => {
    setShowNotification(true);
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
    if (hasNew) {
      localStorage.setItem(NOTIFICATION_KEY, "true");
      setHasNew(false);
    }
  };

  return (
    <>
      <Canvas
        shadows
        frameloop="always"
        gl={{ 
          antialias: true,
          powerPreference: "high-performance",
          alpha: false
        }}
        camera={{
          position: camera.position,
          fov: camera.fov,
        }}
      >
        <SceneBackground color={backgroundColor} />
        <Suspense fallback={<Loader />}>
          <RobotScene
            robotName={robotName}
            urdfUrl={urdfUrl}
            orbitTarget={orbitTarget}
            setJointDetails={setJointDetails}
            jointStates={jointStates}
            robotColor={robotColor}
          />
        </Suspense>
      </Canvas>

      <ControlPanel
        show={showControlPanel}
        onHide={hideControlPanel}
        updateJointsSpeed={updateJointsSpeed}
        jointStates={jointStates}
        updateJointDegrees={updateJointDegrees}
        updateJointsDegrees={updateJointsDegrees}
        updateJointSpeed={updateJointSpeed}
        isConnected={isConnected}
        connectRobot={connectRobot}
        disconnectRobot={disconnectRobot}
        keyboardControlMap={keyboardControlMap}
        compoundMovements={compoundMovements}
      />
      <ChatControl
        show={showChatControl}
        onHide={hideChatControl}
        robotName={robotName}
        systemPrompt={systemPrompt}
      />
      {/* LeaderControl overlay */}
      <LeaderControl
        show={showLeaderControl}
        onHide={hideLeaderControl}
        leaderControl={leaderControl}
        jointDetails={jointDetails}
        onSync={(leaderAngles: { servoId: number; angle: number }[]) => {
          const revoluteJoints = jointDetails.filter(
            (j) => j.jointType === "revolute"
          );
          const revoluteServoIds = new Set(
            revoluteJoints.map((j) => j.servoId)
          );
          updateJointsDegrees(
            leaderAngles
              .filter((la) => revoluteServoIds.has(la.servoId))
              .map(
                ({ servoId, angle }: { servoId: number; angle: number }) => ({
                  servoId,
                  value: angle,
                })
              )
          );
        }}
      />

      {/* Record Control overlay */}
      <RecordControl
        show={showRecordControl}
        onHide={hideRecordControl}
        isRecording={isRecording}
        recordData={recordData}
        startRecording={startRecording}
        stopRecording={stopRecording}
        clearRecordData={clearRecordData}
        updateJointsDegrees={updateJointsDegrees}
        updateJointsSpeed={updateJointsSpeed}
        jointDetails={jointDetails}
        leaderControl={{
          isConnected: leaderControl.isConnected,
          disconnectLeader: leaderControl.disconnectLeader,
        }}
      />

      {/* Background Control overlay */}
      <BackgroundControl
        show={showBackgroundControl}
        onHide={hideBackgroundControl}
        currentColor={backgroundColor}
        onColorChange={setBackgroundColor}
      />

      {/* Robot Color Control overlay */}
      <RobotColorControl
        show={showRobotColorControl}
        onHide={hideRobotColorControl}
        currentColor={robotColor}
        onColorChange={setRobotColor}
      />

      {/* Gamepad Control overlay */}
      <GamepadControl
        show={showGamepadControl}
        onHide={hideGamepadControl}
        isConnected={gamepadControl.isGamepadConnected}
        config={gamepadConfig}
        onConfigChange={(newConfig) => setGamepadConfig(prev => ({ ...prev, ...newConfig }))}
        currentGamepadState={gamepadControl.gamepadState}
        onForceDetection={gamepadControl.forceDetection}
      />

      {/* WASD Control overlay */}
      <WASDControl
        show={showWASDControl}
        onHide={() => setShowWASDControl(false)}
        updateJointDegrees={updateJointDegrees}
        updateJointsDegrees={updateJointsDegrees}
        jointDetails={jointDetails}
      />

      <div className="absolute bottom-5 left-0 right-0">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2 max-w-md">
            <LeaderControlButton
              showControlPanel={showLeaderControl}
              onToggleControlPanel={toggleLeaderControl}
            />
            <KeyboardControlButton
              showControlPanel={showControlPanel}
              onToggleControlPanel={toggleControlPanel}
            />
            <ChatControlButton
              showControlPanel={showChatControl}
              onToggleControlPanel={toggleChatControl}
            />
            <BackgroundControlButton
              showControlPanel={showBackgroundControl}
              onToggleControlPanel={toggleBackgroundControl}
            />
            <RobotColorControlButton
              showControlPanel={showRobotColorControl}
              onToggleControlPanel={toggleRobotColorControl}
            />
            <GamepadControlButton
              showControlPanel={showGamepadControl}
              onToggleControlPanel={toggleGamepadControl}
              isConnected={gamepadControl.isGamepadConnected}
            />
            <WASDControlButton
              showControlPanel={showWASDControl}
              onToggleControlPanel={toggleWASDControl}
            />
            <RecordButton
              showControlPanel={showRecordControl}
              onToggleControlPanel={toggleRecordControl}
            />
            <NotificationButton
              onClick={handleBellClick}
              hasNew={hasNew}
            />
          </div>
        </div>
      </div>

      <NotificationDialog
        open={showNotification}
        onOpenChange={setShowNotification}
        onClose={handleCloseNotification}
      />
    </>
  );
}
