import { api } from './client.js';

/**
 * Analyze resume against a job description.
 * Supports:
 * - Direct FormData (with field 'resume' and/or 'resumeText', and 'jobDescription')
 * - Object payload with binary file: { file, jobDescription }
 * - Object payload with plain text: { resumeText, jobDescription }
 *
 * @param {FormData|Object} data - Input payload or FormData
 * @returns {Promise<Object>} Backend ApiResponse { success: true, data: { analysis: {...} } }
 */
export async function analyzeResumeApi(data) {
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    return api.post('/resume/analyze', data);
  }

  const { file, resumeText, jobDescription } = data || {};

  if (file) {
    const formData = new FormData();
    formData.append('resume', file);
    if (jobDescription) {
      formData.append('jobDescription', jobDescription);
    }
    return api.post('/resume/analyze', formData);
  }

  return api.post('/resume/analyze', {
    resumeText: resumeText || '',
    jobDescription: jobDescription || '',
  });
}

/**
 * Fetch authenticated user's resume analysis history.
 *
 * @returns {Promise<Object>} Backend ApiResponse { success: true, data: { analyses: [...] } }
 */
export async function getResumeHistoryApi() {
  return api.get('/resume/history');
}

/**
 * Fetch a specific resume analysis by its ID.
 *
 * @param {string} id - Analysis ObjectId
 * @returns {Promise<Object>} Backend ApiResponse { success: true, data: { analysis: {...} } }
 */
export async function getResumeAnalysisByIdApi(id) {
  return api.get(`/resume/history/${id}`);
}

/**
 * Delete a specific resume analysis by its ID.
 *
 * @param {string} id - Analysis ObjectId
 * @returns {Promise<Object>} Backend ApiResponse { success: true, data: null, message: "..." }
 */
export async function deleteResumeAnalysisApi(id) {
  return api.delete(`/resume/history/${id}`);
}
