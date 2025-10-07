// Traducciones de nombres de articulaciones al español
export const jointTranslations: { [key: string]: string } = {
  // Articulaciones básicas
  "Rotation": "Rotación",
  "Pitch": "Inclinación",
  "Roll": "Giro",
  "Yaw": "Guiñada",
  "Elbow": "Codo",
  "Jaw": "Mandíbula",
  
  // Articulaciones de muñeca
  "Wrist_Pitch": "Inclinación de Muñeca",
  "Wrist_Roll": "Giro de Muñeca",
  "Wrist": "Muñeca",
  
  // Articulaciones de brazo
  "Shoulder": "Hombro",
  "Shoulder_Pitch": "Inclinación de Hombro",
  "Shoulder_Roll": "Giro de Hombro",
  "Shoulder_Yaw": "Guiñada de Hombro",
  
  // Articulaciones de pierna
  "Hip": "Cadera",
  "Hip_Pitch": "Inclinación de Cadera",
  "Hip_Roll": "Giro de Cadera",
  "Hip_Yaw": "Guiñada de Cadera",
  "Knee": "Rodilla",
  "Ankle": "Tobillo",
  "Ankle_Pitch": "Inclinación de Tobillo",
  "Ankle_Roll": "Giro de Tobillo",
  "Thigh": "Muslo",
  "Calf": "Pantorrilla",
  
  // Articulaciones específicas de robots
  "Waist": "Cintura",
  "Waist_Yaw": "Guiñada de Cintura",
  
  // Prefijos para articulaciones izquierda/derecha
  "R_": "D_", // Right -> Derecha
  "L_": "I_", // Left -> Izquierda
  "FL_": "DI_", // Front Left -> Delantero Izquierdo
  "FR_": "DD_", // Front Right -> Delantero Derecho
  "RL_": "TI_", // Rear Left -> Trasero Izquierdo
  "RR_": "TD_", // Rear Right -> Trasero Derecho
  
  // Articulaciones específicas con prefijos
  "R_Rotation": "Rotación Derecha",
  "R_Pitch": "Inclinación Derecha",
  "R_Elbow": "Codo Derecho",
  "R_Wrist_Pitch": "Inclinación de Muñeca Derecha",
  "R_Wrist_Roll": "Giro de Muñeca Derecha",
  "R_Jaw": "Mandíbula Derecha",
  
  "L_Rotation": "Rotación Izquierda",
  "L_Pitch": "Inclinación Izquierda",
  "L_Elbow": "Codo Izquierdo",
  "L_Wrist_Pitch": "Inclinación de Muñeca Izquierda",
  "L_Wrist_Roll": "Giro de Muñeca Izquierda",
  "L_Jaw": "Mandíbula Izquierda",
  
  // Articulaciones de robot cuadrúpedo
  "FL_hip_joint": "Articulación de Cadera Delantera Izquierda",
  "FL_thigh_joint": "Articulación de Muslo Delantero Izquierdo",
  "FL_calf_joint": "Articulación de Pantorrilla Delantera Izquierda",
  "FR_hip_joint": "Articulación de Cadera Delantera Derecha",
  "FR_thigh_joint": "Articulación de Muslo Delantero Derecho",
  "FR_calf_joint": "Articulación de Pantorrilla Delantera Derecha",
  "RL_hip_joint": "Articulación de Cadera Trasera Izquierda",
  "RL_thigh_joint": "Articulación de Muslo Trasero Izquierdo",
  "RL_calf_joint": "Articulación de Pantorrilla Trasera Izquierda",
  "RR_hip_joint": "Articulación de Cadera Trasera Derecha",
  "RR_thigh_joint": "Articulación de Muslo Trasero Derecho",
  "RR_calf_joint": "Articulación de Pantorrilla Trasera Derecha",
  
  // Articulaciones de robot humanoide
  "left_hip_pitch_joint": "Articulación de Inclinación de Cadera Izquierda",
  "left_hip_roll_joint": "Articulación de Giro de Cadera Izquierda",
  "left_hip_yaw_joint": "Articulación de Guiñada de Cadera Izquierda",
  "left_knee_joint": "Articulación de Rodilla Izquierda",
  "left_ankle_pitch_joint": "Articulación de Inclinación de Tobillo Izquierdo",
  "left_ankle_roll_joint": "Articulación de Giro de Tobillo Izquierdo",
  "right_hip_pitch_joint": "Articulación de Inclinación de Cadera Derecha",
  "right_hip_roll_joint": "Articulación de Giro de Cadera Derecha",
  "right_hip_yaw_joint": "Articulación de Guiñada de Cadera Derecha",
  "right_knee_joint": "Articulación de Rodilla Derecha",
  "right_ankle_pitch_joint": "Articulación de Inclinación de Tobillo Derecho",
  "right_ankle_roll_joint": "Articulación de Giro de Tobillo Derecho",
  "waist_yaw_joint": "Articulación de Guiñada de Cintura",
  "left_shoulder_pitch_joint": "Articulación de Inclinación de Hombro Izquierdo",
  "left_shoulder_roll_joint": "Articulación de Giro de Hombro Izquierdo",
  "left_shoulder_yaw_joint": "Articulación de Guiñada de Hombro Izquierdo",
  "left_elbow_joint": "Articulación de Codo Izquierdo",
  "left_wrist_roll_joint": "Articulación de Giro de Muñeca Izquierda",
  "right_shoulder_pitch_joint": "Articulación de Inclinación de Hombro Derecho",
  "right_shoulder_roll_joint": "Articulación de Giro de Hombro Derecho",
  "right_shoulder_yaw_joint": "Articulación de Guiñada de Hombro Derecho",
  "right_elbow_joint": "Articulación de Codo Derecho",
  "right_wrist_roll_joint": "Articulación de Giro de Muñeca Derecha",
  
  // Ruedas
  "left_wheel": "Rueda Izquierda",
  "back_wheel": "Rueda Trasera",
  "right_wheel": "Rueda Derecha",
};

// Función para traducir nombres de articulaciones
export function translateJointName(jointName: string): string {
  // Buscar traducción exacta primero
  if (jointTranslations[jointName]) {
    return jointTranslations[jointName];
  }
  
  // Si no hay traducción exacta, devolver el nombre original
  return jointName;
}

// Traducciones para movimientos compuestos
export const compoundMovementTranslations: { [key: string]: string } = {
  "Jaw down & up": "Mandíbula abajo y arriba",
  "Jaw backward & forward": "Mandíbula atrás y adelante",
  "Compound Movements": "Movimientos Compuestos",
};

// Función para traducir nombres de movimientos compuestos
export function translateCompoundMovement(movementName: string): string {
  return compoundMovementTranslations[movementName] || movementName;
}