import api from './api';

export const getTaskComments = async (taskId) => (await api.get(`/tasks/${taskId}/comments`)).data;
export const createTaskComment = async (taskId, content) => (await api.post(`/tasks/${taskId}/comments`, { content })).data;
export const updateTaskComment = async (commentId, content) => (await api.put(`/comments/${commentId}`, { content })).data;
export const deleteTaskComment = async (commentId) => (await api.delete(`/comments/${commentId}`)).data;
export const getProjectFiles = async (projectId) => (await api.get(`/projects/${projectId}/files`)).data;
export const uploadProjectFile = async (projectId, file, onUploadProgress) => (await api.post(`/projects/${projectId}/files`, file, {
  headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': encodeURIComponent(file.name), 'X-File-Content-Type': file.type || 'application/octet-stream' },
  timeout: 120000,
  onUploadProgress
})).data;
export const downloadProjectFile = async (projectId, fileId) => (await api.get(`/projects/${projectId}/files/${fileId}/download`, { responseType: 'blob', timeout: 120000 })).data;
export const deleteProjectFile = async (projectId, fileId) => (await api.delete(`/projects/${projectId}/files/${fileId}`)).data;
