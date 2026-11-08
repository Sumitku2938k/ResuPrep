import { api } from './client.js';

export const VALID_FEEDBACK_FEATURES = [
  'resume-analyzer',
  'job-matcher',
  'resume-builder',
  'cover-letter',
  'skill-assessment',
  'general',
];

/**
 * Submit feedback to the backend.
 *
 * Validated in backend by Joi feedbackSchema:
 * - name: string, 2-50 chars, required
 * - role: string, max 50 chars, default 'User'
 * - rating: integer, 1-5, required
 * - feature: enum, default 'general'
 * - message: string, 10-1000 chars, required
 *
 * @param {Object} data - Feedback submission payload
 * @param {string} data.name - Submitter name (2-50 chars)
 * @param {string} [data.role='User'] - Submitter professional role (max 50 chars)
 * @param {number} data.rating - Rating integer from 1 to 5
 * @param {string} [data.feature='general'] - Targeted platform feature
 * @param {string} data.message - Detailed feedback message (10-1000 chars)
 * @returns {Promise<Object>} Backend ApiResponse { success: true, message: string, data: { feedback: Object } }
 * @throws {Error} If client-side pre-flight validation fails or network/server error occurs
 */
export async function createFeedbackApi(data = {}) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Feedback payload must be an object');
  }

  // Validate name
  if (typeof data.name !== 'string' || data.name.trim().length < 2 || data.name.trim().length > 50) {
    throw new Error('Name is required and must be between 2 and 50 characters');
  }

  // Validate rating
  const numRating = Number(data.rating);
  if (
    data.rating === undefined ||
    data.rating === null ||
    data.rating === '' ||
    Number.isNaN(numRating) ||
    !Number.isInteger(numRating) ||
    numRating < 1 ||
    numRating > 5
  ) {
    throw new Error('Rating is required and must be an integer between 1 and 5');
  }

  // Validate message
  if (typeof data.message !== 'string' || data.message.trim().length < 10 || data.message.trim().length > 1000) {
    throw new Error('Message is required and must be between 10 and 1000 characters');
  }

  // Validate role if provided
  if (data.role !== undefined && data.role !== null && data.role !== '') {
    if (typeof data.role !== 'string' || data.role.trim().length > 50) {
      throw new Error('Role must be a string up to 50 characters');
    }
  }

  // Validate feature if provided
  if (data.feature !== undefined && data.feature !== null && data.feature !== '') {
    if (typeof data.feature !== 'string') {
      throw new Error(`Invalid feature. Must be one of: ${VALID_FEEDBACK_FEATURES.join(', ')}`);
    }
    const normalizedFeature = data.feature.trim().toLowerCase();
    if (!VALID_FEEDBACK_FEATURES.includes(normalizedFeature)) {
      throw new Error(`Invalid feature. Must be one of: ${VALID_FEEDBACK_FEATURES.join(', ')}`);
    }
  }

  const payload = {
    name: data.name.trim(),
    rating: numRating,
    message: data.message.trim(),
    ...(data.role && typeof data.role === 'string' && data.role.trim() && { role: data.role.trim() }),
    ...(data.feature && typeof data.feature === 'string' && data.feature.trim() && { feature: data.feature.trim().toLowerCase() }),
  };

  return api.post('/feedback', payload);
}

/**
 * Retrieve public feedback entries.
 *
 * Fetches newest public feedback items (limit: 50).
 * Public endpoint, authentication is not required.
 *
 * @param {Object} [_params={}] - Optional parameter placeholder for interface consistency
 * @returns {Promise<Object>} Backend ApiResponse { success: true, message: string, data: { feedback: Array } }
 */
export async function getFeedbackApi(_params = {}) {
  return api.get('/feedback/public');
}

