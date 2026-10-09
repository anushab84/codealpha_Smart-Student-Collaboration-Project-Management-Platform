import api from './api';

/**
 * Fetch all tasks for a specific project
 */
export const getProjectTasks = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/tasks`);
  return response.data;
};

/**
 * Fetch individual task details by ID
 */
export const getTask = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

/**
 * Create a new task inside a project
 */
export const createTask = async (projectId, taskData) => {
  const response = await api.post(`/projects/${projectId}/tasks`, taskData);
  return response.data;
};

/**
 * Update task details or status on Kanban board
 */
export const updateTask = async (taskId, taskData) => {
  const response = await api.put(`/tasks/${taskId}`, taskData);
  return response.data;
};

/**
 * Delete a task (Project owner or Task creator only)
 */
export const deleteTask = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

/**
 * Fetch global task summary metrics for dashboard
 */
export const getDashboardTaskSummary = async () => {
  const response = await api.get('/tasks/summary');
  return response.data;
};
