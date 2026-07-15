import { Router } from 'express';
import { analytics, createProject, deleteProject, exportProjects, filters, getProject, getProjects, updateProject } from '../controllers/project.controller.js';

export const projectRouter = Router();

projectRouter.get('/', getProjects);
projectRouter.get('/analytics', analytics);
projectRouter.get('/filters', filters);
projectRouter.get('/export', exportProjects);
projectRouter.get('/:id', getProject);
projectRouter.post('/', createProject);
projectRouter.put('/:id', updateProject);
projectRouter.delete('/:id', deleteProject);
