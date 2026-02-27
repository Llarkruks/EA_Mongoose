// src/project.ts
import { Schema, model, Types } from 'mongoose';

// --- 1. INTERFACE Y SCHEMA ---
export interface IProject {
  _id?: string;
  title: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  organization: Types.ObjectId | string; 
}

const projectSchema = new Schema<IProject>({
  title: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'DONE'], default: 'PENDING' },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true } 
});

export const ProjectModel = model<IProject>('Project', projectSchema);

// --- 2. SERVICE LAYER ---
export const ProjectService = {
  create: async (data: Partial<IProject>) => {
    return await ProjectModel.create(data);
  },
  
  // getById(id): Retorna con su populate de la colección enlazada
  getById: async (id: string) => {
    return await ProjectModel.findById(id).populate('organization');
  },
  
  // update(id, data): Modifica los datos
  update: async (id: string, data: Partial<IProject>) => {
    return await ProjectModel.findByIdAndUpdate(id, data, { new: true });
  },
  
  // delete(id): Elimina
  delete: async (id: string) => {
    return await ProjectModel.findByIdAndDelete(id);
  },
  
  // listAll(): Lista todos los documentos usando .lean()
  listAll: async () => {
    return await ProjectModel.find().lean();
  }
};