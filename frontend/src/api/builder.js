import { api } from './client.js';

/**
 * Validates that an ID argument is a non-empty string.
 *
 * @param {*} id - Identifier to validate
 * @returns {string} Trimmed ID string
 * @throws {Error} If ID is missing, not a string, or empty
 */
function validateId(id) {
  if (!id || typeof id !== 'string' || !id.trim()) {
    throw new Error('A valid resume ID is required');
  }
  return id.trim();
}

/**
 * Create a new resume record.
 * Supports authenticated users (persisted with user ownership)
 * and anonymous users (saved with user: null).
 *
 * @param {Object} resumeData - Resume payload conforming to ResumeBuilder schema
 * @returns {Promise<Object>} Backend ApiResponse { success: true, message: string, data: { resume: Object } }
 */
export async function createResumeApi(resumeData) {
  return api.post('/builder', resumeData);
}

/**
 * Fetch all resumes belonging to the currently authenticated user.
 * Requires user authentication (JWT).
 *
 * @returns {Promise<Object>} Backend ApiResponse { success: true, message: string, data: { resumes: Array } }
 */
export async function getResumesApi() {
  return api.get('/builder');
}

/**
 * Fetch a single resume by its unique identifier.
 * Scoped to the authenticated owner.
 *
 * @param {string} id - The resume record ID
 * @returns {Promise<Object>} Backend ApiResponse { success: true, message: string, data: { resume: Object } }
 */
export async function getResumeByIdApi(id) {
  const safeId = validateId(id);
  return api.get(`/builder/${encodeURIComponent(safeId)}`);
}

/**
 * Update an existing resume record.
 * Scoped to the authenticated owner.
 *
 * @param {string} id - The resume record ID to update
 * @param {Object} resumeData - Updated resume payload conforming to ResumeBuilder schema
 * @returns {Promise<Object>} Backend ApiResponse { success: true, message: string, data: { resume: Object } }
 */
export async function updateResumeApi(id, resumeData) {
  const safeId = validateId(id);
  return api.put(`/builder/${encodeURIComponent(safeId)}`, resumeData);
}

/**
 * Delete a resume record by its unique identifier.
 * Scoped to the authenticated owner.
 *
 * @param {string} id - The resume record ID to delete
 * @returns {Promise<Object>} Backend ApiResponse { success: true, message: string, data: null }
 */
export async function deleteResumeApi(id) {
  const safeId = validateId(id);
  return api.delete(`/builder/${encodeURIComponent(safeId)}`);
}

