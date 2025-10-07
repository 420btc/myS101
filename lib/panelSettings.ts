// Panel visibility state management
const PANEL_SETTINGS_KEY = "panel_settings";

type PanelStates = {
  keyboardControl?: boolean;
  leaderControl?: boolean;
  chatControl?: boolean;
  recordControl?: boolean;
};

type RobotPanelSettings = {
  [robotName: string]: PanelStates;
};

function getAllPanelSettings(): RobotPanelSettings {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return {};
  }
  
  try {
    const stored = localStorage.getItem(PANEL_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Error reading panel settings from localStorage:', error);
    return {};
  }
}

function saveAllPanelSettings(settings: RobotPanelSettings) {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(PANEL_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Error saving panel settings to localStorage:', error);
  }
}

export function getPanelStateFromLocalStorage(
  panelName: string,
  robotName: string
): boolean | null {
  const allSettings = getAllPanelSettings();
  const robotSettings = allSettings[robotName];
  return robotSettings?.[panelName as keyof PanelStates] ?? null;
}

export function setPanelStateToLocalStorage(
  panelName: string,
  isOpen: boolean,
  robotName: string
) {
  const allSettings = getAllPanelSettings();
  if (!allSettings[robotName]) {
    allSettings[robotName] = {};
  }
  allSettings[robotName][panelName as keyof PanelStates] = isOpen;
  saveAllPanelSettings(allSettings);
}

// Bonus: Helper function to get all panel states for a robot
export function getAllPanelStatesForRobot(robotName: string): PanelStates {
  const allSettings = getAllPanelSettings();
  return allSettings[robotName] || {};
}
