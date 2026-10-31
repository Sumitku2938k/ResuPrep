import { api } from './client.js';

const VALID_TONES = ['professional', 'enthusiastic', 'concise'];

/**
 * Validates that an ID argument is a non-empty string.
 *
 * @param {*} id - Identifier to validate
 * @returns {string} Trimmed ID string
 * @throws {Error} If ID is missing, not a string, or empty
 */
function validateId(id) {
  if (!id || typeof id !== 'string' || !id.trim()) {
    throw new Error('A valid cover letter ID is required');
  }
  return id.trim();
}

/**
 * Generate a new AI cover letter.
 *
 * NOTE: The backend automatically persists the generated cover letter to MongoDB.
 * For authenticated users, the record is linked to their user account.
 * For anonymous users, the record is stored with user: null.
 * A successful generation is therefore also a persistence operation;
 * do NOT issue a second create/save request.
 *
 * @param {Object} data - Cover letter generation request payload
 * @param {string} data.name - Applicant full name (required)
 * @param {string} data.jobTitle - Target job title / role (required)
 * @param {string} data.company - Target company name (required)
 * @param {string} [data.hiringManager] - Recipient / hiring manager name (optional, defaults to 'Hiring Manager')
 * @param {string} [data.keySkills] - Key skills string (optional)
 * @param {string} [data.achievement] - Notable achievement (optional)
 * @param {string} [data.tone] - Tone: 'professional' | 'enthusiastic' | 'concise' (optional, defaults to 'professional')
 * @returns {Promise<Object>} Backend ApiResponse { success: true, message: string, data: { coverLetter: Object } }
 */
export async function generateCoverLetterApi(data = {}) {
  if (!data || typeof data !== 'object') {
    throw new Error('Cover letter payload must be an object');
  }

  const { name, jobTitle, company, hiringManager, keySkills, achievement, tone } = data;

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new Error('Applicant name is required and must be a non-empty string');
  }

  if (!jobTitle || typeof jobTitle !== 'string' || !jobTitle.trim()) {
    throw new Error('Job title is required and must be a non-empty string');
  }

  if (!company || typeof company !== 'string' || !company.trim()) {
    throw new Error('Company name is required and must be a non-empty string');
  }

  if (tone !== undefined && tone !== null) {
    if (typeof tone !== 'string' || !VALID_TONES.includes(tone.toLowerCase().trim())) {
      throw new Error(`Invalid tone. Supported tones are: ${VALID_TONES.join(', ')}`);
    }
  }

  const payload = {
    name: name.trim(),
    jobTitle: jobTitle.trim(),
    company: company.trim(),
    ...(hiringManager !== undefined && { hiringManager: typeof hiringManager === 'string' ? hiringManager.trim() : hiringManager }),
    ...(keySkills !== undefined && { keySkills: typeof keySkills === 'string' ? keySkills.trim() : String(keySkills) }),
    ...(achievement !== undefined && { achievement: typeof achievement === 'string' ? achievement.trim() : String(achievement) }),
    ...(tone !== undefined && tone !== null && { tone: tone.toLowerCase().trim() }),
  };

  return api.post('/cover-letter/generate', payload);
}

/**
 * Fetch all saved cover letters belonging to the currently authenticated user.
 * Requires user authentication (JWT).
 *
 * @returns {Promise<Object>} Backend ApiResponse { success: true, message: string, data: { coverLetters: Array } }
 */
export async function getCoverLettersApi() {
  return api.get('/cover-letter');
}

/**
 * Update an existing cover letter document.
 * Scoped to the authenticated owner.
 *
 * Note: This updates persisted metadata/text on the document;
 * it does not re-invoke the AI generation service.
 *
 * @param {string} id - The cover letter document ID
 * @param {Object} data - Fields to update (e.g. generatedLetter, tone, keySkills)
 * @returns {Promise<Object>} Backend ApiResponse { success: true, message: string, data: { coverLetter: Object } }
 */
export async function updateCoverLetterApi(id, data) {
  const safeId = validateId(id);

  if (!data || typeof data !== 'object') {
    throw new Error('Update payload must be an object');
  }

  return api.put(`/cover-letter/${encodeURIComponent(safeId)}`, data);
}

/**
 * Delete a saved cover letter by its unique identifier.
 * Scoped to the authenticated owner.
 *
 * @param {string} id - The cover letter document ID to delete
 * @returns {Promise<Object>} Backend ApiResponse { success: true, message: string, data: null }
 */
export async function deleteCoverLetterApi(id) {
  const safeId = validateId(id);
  return api.delete(`/cover-letter/${encodeURIComponent(safeId)}`);
}

