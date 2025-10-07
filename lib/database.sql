-- Tabla para almacenar datasets de grabaciones de robot
CREATE TABLE IF NOT EXISTS robot_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration DECIMAL(10, 3) NOT NULL, -- Duración en segundos con 3 decimales
    frame_count INTEGER NOT NULL,
    record_data JSONB NOT NULL, -- Array de arrays con los datos de grabación
    joint_details JSONB NOT NULL, -- Información sobre las articulaciones
    version VARCHAR(50) DEFAULT '1.0',
    recording_interval INTEGER DEFAULT 20, -- Intervalo de grabación en ms
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_robot_datasets_timestamp ON robot_datasets(timestamp);
CREATE INDEX IF NOT EXISTS idx_robot_datasets_name ON robot_datasets(name);
CREATE INDEX IF NOT EXISTS idx_robot_datasets_created_at ON robot_datasets(created_at);

-- Función para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_robot_datasets_updated_at 
    BEFORE UPDATE ON robot_datasets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();