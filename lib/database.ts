import { neon } from '@neondatabase/serverless';

// Configuración de la conexión a la base de datos
export const sql = neon(process.env.DATABASE_URL!);

// Tipos para los datasets
export interface SavedDataset {
  id: string;
  name: string;
  timestamp: string;
  duration: number;
  frameCount: number;
  recordData: number[][];
  jointDetails: {
    jointNames: string[];
    jointCount: number;
  };
  version: string;
  recordingInterval: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDatasetInput {
  name: string;
  duration: number;
  frameCount: number;
  recordData: number[][];
  jointDetails: {
    jointNames: string[];
    jointCount: number;
  };
  version?: string;
  recordingInterval?: number;
}

// Función para inicializar la base de datos (crear tablas si no existen)
export async function initializeDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS robot_datasets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        duration DECIMAL(10, 3) NOT NULL,
        frame_count INTEGER NOT NULL,
        record_data JSONB NOT NULL,
        joint_details JSONB NOT NULL,
        version VARCHAR(50) DEFAULT '1.0',
        recording_interval INTEGER DEFAULT 20,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_robot_datasets_timestamp ON robot_datasets(timestamp)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_robot_datasets_name ON robot_datasets(name)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_robot_datasets_created_at ON robot_datasets(created_at)
    `;

    console.log('Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error inicializando la base de datos:', error);
    throw error;
  }
}