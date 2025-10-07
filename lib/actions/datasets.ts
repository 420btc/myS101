'use server';

import { sql, SavedDataset, CreateDatasetInput, initializeDatabase } from '../database';
import { revalidatePath } from 'next/cache';

// Re-exportar tipos para uso en componentes
export type { SavedDataset, CreateDatasetInput } from '../database';

// Inicializar la base de datos al cargar el módulo
initializeDatabase().catch(console.error);

// Crear un nuevo dataset
export async function createDataset(input: CreateDatasetInput): Promise<SavedDataset> {
  try {
    const result = await sql`
      INSERT INTO robot_datasets (
        name, 
        duration, 
        frame_count, 
        record_data, 
        joint_details, 
        version, 
        recording_interval
      )
      VALUES (
        ${input.name},
        ${input.duration},
        ${input.frameCount},
        ${JSON.stringify(input.recordData)},
        ${JSON.stringify(input.jointDetails)},
        ${input.version || '1.0'},
        ${input.recordingInterval || 20}
      )
      RETURNING *
    `;

    const dataset = result[0];
    
    revalidatePath('/');
    
    return {
      id: dataset.id,
      name: dataset.name,
      timestamp: dataset.timestamp,
      duration: parseFloat(dataset.duration),
      frameCount: dataset.frame_count,
      recordData: dataset.record_data,
      jointDetails: dataset.joint_details,
      version: dataset.version,
      recordingInterval: dataset.recording_interval,
      createdAt: dataset.created_at,
      updatedAt: dataset.updated_at
    };
  } catch (error) {
    console.error('Error creando dataset:', error);
    throw new Error('Error al guardar el dataset en la base de datos');
  }
}

// Obtener todos los datasets
export async function getDatasets(): Promise<SavedDataset[]> {
  try {
    const result = await sql`
      SELECT * FROM robot_datasets 
      ORDER BY created_at DESC
    `;

    return result.map((dataset: any) => ({
      id: dataset.id,
      name: dataset.name,
      timestamp: dataset.timestamp,
      duration: parseFloat(dataset.duration),
      frameCount: dataset.frame_count,
      recordData: dataset.record_data,
      jointDetails: dataset.joint_details,
      version: dataset.version,
      recordingInterval: dataset.recording_interval,
      createdAt: dataset.created_at,
      updatedAt: dataset.updated_at
    }));
  } catch (error) {
    console.error('Error obteniendo datasets:', error);
    throw new Error('Error al obtener los datasets de la base de datos');
  }
}

// Obtener un dataset por ID
export async function getDatasetById(id: string): Promise<SavedDataset | null> {
  try {
    const result = await sql`
      SELECT * FROM robot_datasets 
      WHERE id = ${id}
    `;

    if (result.length === 0) {
      return null;
    }

    const dataset = result[0];
    
    return {
      id: dataset.id,
      name: dataset.name,
      timestamp: dataset.timestamp,
      duration: parseFloat(dataset.duration),
      frameCount: dataset.frame_count,
      recordData: dataset.record_data,
      jointDetails: dataset.joint_details,
      version: dataset.version,
      recordingInterval: dataset.recording_interval,
      createdAt: dataset.created_at,
      updatedAt: dataset.updated_at
    };
  } catch (error) {
    console.error('Error obteniendo dataset por ID:', error);
    throw new Error('Error al obtener el dataset de la base de datos');
  }
}

// Actualizar un dataset
export async function updateDataset(id: string, updates: Partial<CreateDatasetInput>): Promise<SavedDataset> {
  try {
    const setClause = [];
    const values = [];
    
    if (updates.name !== undefined) {
      setClause.push('name = $' + (values.length + 1));
      values.push(updates.name);
    }
    
    if (updates.duration !== undefined) {
      setClause.push('duration = $' + (values.length + 1));
      values.push(updates.duration);
    }
    
    if (updates.frameCount !== undefined) {
      setClause.push('frame_count = $' + (values.length + 1));
      values.push(updates.frameCount);
    }
    
    if (updates.recordData !== undefined) {
      setClause.push('record_data = $' + (values.length + 1));
      values.push(JSON.stringify(updates.recordData));
    }
    
    if (updates.jointDetails !== undefined) {
      setClause.push('joint_details = $' + (values.length + 1));
      values.push(JSON.stringify(updates.jointDetails));
    }

    if (setClause.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    setClause.push('updated_at = NOW()');
    values.push(id);

    const result = await sql`
      UPDATE robot_datasets 
      SET ${sql.unsafe(setClause.join(', '))}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error('Dataset no encontrado');
    }

    const dataset = result[0];
    
    revalidatePath('/');
    
    return {
      id: dataset.id,
      name: dataset.name,
      timestamp: dataset.timestamp,
      duration: parseFloat(dataset.duration),
      frameCount: dataset.frame_count,
      recordData: dataset.record_data,
      jointDetails: dataset.joint_details,
      version: dataset.version,
      recordingInterval: dataset.recording_interval,
      createdAt: dataset.created_at,
      updatedAt: dataset.updated_at
    };
  } catch (error) {
    console.error('Error actualizando dataset:', error);
    throw new Error('Error al actualizar el dataset en la base de datos');
  }
}

// Eliminar un dataset
export async function deleteDataset(id: string): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM robot_datasets 
      WHERE id = ${id}
      RETURNING id
    `;

    revalidatePath('/');
    
    return result.length > 0;
  } catch (error) {
    console.error('Error eliminando dataset:', error);
    throw new Error('Error al eliminar el dataset de la base de datos');
  }
}

// Eliminar datasets antiguos (mantener solo los últimos N)
export async function cleanupOldDatasets(keepCount: number = 10): Promise<number> {
  try {
    const result = await sql`
      DELETE FROM robot_datasets 
      WHERE id NOT IN (
        SELECT id FROM robot_datasets 
        ORDER BY created_at DESC 
        LIMIT ${keepCount}
      )
      RETURNING id
    `;

    revalidatePath('/');
    
    return result.length;
  } catch (error) {
    console.error('Error limpiando datasets antiguos:', error);
    throw new Error('Error al limpiar datasets antiguos');
  }
}