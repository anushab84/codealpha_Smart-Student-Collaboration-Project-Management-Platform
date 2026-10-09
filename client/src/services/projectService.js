import api from './api';

/**
 * Fetch all projects for the authenticated user
 */
export const getProjects = async () => {
  const response = await api.get('/projects');
  return response.data;
};

/**
 * Fetch project dashboard summary & metrics
 */
export const getProjectSummary = async () => {
  const response = await api.get('/projects/summary');
  return response.data;
};

/**
 * Fetch details for a single project by ID
 */
export const getProject = async (id) => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
};

/**
 * Create a new project
 */
export const createProject = async (projectData) => {
  const response = await api.post('/projects', projectData);
  return response.data;
};

/**
 * Update an existing project
 */
export const updateProject = async (id, projectData) => {
  const response = await api.put(`/projects/${id}`, projectData);
  return response.data;
};

/**
 * Delete a project (Owner only)
 */
export const deleteProject = async (id) => {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
};

/**
 * Add a registered user to project team
 */
export const addMember = async (projectId, userId, role = 'Member') => {
  const response = await api.post(`/projects/${projectId}/members`, { userId, role });
  return response.data;
};

/**
 * Remove a team member from project
 */
export const removeMember = async (projectId, userId) => {
  const response = await api.delete(`/projects/${projectId}/members/${userId}`);
  return response.data;
};

/**
 * Search registered users by name or email for adding to team
 */
export const searchUsers = async (query) => {
  const response = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
  return response.data;
};
