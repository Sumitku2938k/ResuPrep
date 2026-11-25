import { api } from './client.js';

export const MIN_JD_LENGTH = 20;
export const MAX_JD_LENGTH = 10000;

export const ALLOWED_JOB_QUERY_KEYS = [
  'search',
  'category',
  'jobType',
  'workMode',
  'experienceLevel',
  'location',
  'page',
  'limit',
];

/**
 * Validates that an identifier argument is a non-empty string.
 *
 * @param {*} id - Identifier to validate
 * @param {string} [fieldName='ID'] - Field name for descriptive error message
 * @returns {string} Trimmed identifier string
 * @throws {Error} If ID is missing, not a string, or whitespace-only
 */
function validateId(id, fieldName = 'ID') {
  if (!id || typeof id !== 'string' || !id.trim()) {
    throw new Error(`A valid ${fieldName} is required`);
  }
  return id.trim();
}

/**
 * Fetch the job catalogue with optional filtering and pagination.
 *
 * Supported query parameters:
 * - `search`: string (matches title, company, description)
 * - `category`: string ('tech', 'data', 'design', 'product', 'business', 'devops')
 * - `jobType`: string ('Full-time', 'Part-time', 'Contract', 'Internship')
 * - `workMode`: string ('On-site', 'Remote', 'Hybrid')
 * - `experienceLevel`: string ('entry', 'mid', 'senior', 'lead')
 * - `location`: string (geographic location)
 * - `page`: positive integer (default 1)
 * - `limit`: positive integer, max 50 (default 10)
 *
 * @param {Object} [params={}] - Optional query filters and pagination settings
 * @returns {Promise<Object>} Backend ApiResponse { success: true, message: string, data: { jobs: Array, pagination: Object } }
 */
export async function getJobsApi(params = {}) {
  const searchParams = new URLSearchParams();

  if (params && typeof params === 'object' && !Array.isArray(params)) {
    for (const key of ALLOWED_JOB_QUERY_KEYS) {
      const val = params[key];
      if (val !== undefined && val !== null) {
        if (typeof val === 'string') {
          const trimmed = val.trim();
          if (trimmed !== '') {
            searchParams.append(key, trimmed);
          }
        } else if (typeof val === 'number' && !Number.isNaN(val)) {
          searchParams.append(key, String(val));
        }
      }
    }
  }

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/jobs?${queryString}` : '/jobs';

  return api.get(endpoint);
}

/**
 * Retrieve full details for a single active job listing.
 *
 * @param {string} id - The 24-character hexadecimal MongoDB ObjectId
 * @returns {Promise<Object>} Backend ApiResponse { success: true, message: string, data: { job: Object } }
 * @throws {Error} If ID is missing, not a string, or whitespace-only
 */
export async function getJobByIdApi(id) {
  const safeId = validateId(id, 'job ID');
  return api.get(`/jobs/${encodeURIComponent(safeId)}`);
}

/**
 * Calculate deterministic match between an authenticated user's saved resume and an active job listing.
 * Authentication required (`protect` middleware on backend).
 *
 * @param {Object} payload - Matching payload
 * @param {string} payload.resumeId - The 24-hex ObjectId of the user's saved resume
 * @param {string} payload.jobId - The 24-hex ObjectId of the active job
 * @returns {Promise<Object>} Backend ApiResponse { success: true, message: string, data: Object }
 * @throws {Error} If payload is invalid or required IDs are missing/invalid
 */
export async function matchJobApi(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Match payload must be an object with resumeId and jobId');
  }

  const safeResumeId = validateId(payload.resumeId, 'resume ID');
  const safeJobId = validateId(payload.jobId, 'job ID');

  return api.post('/jobs/match', {
    resumeId: safeResumeId,
    jobId: safeJobId,
  });
}

/**
 * Calculate deterministic match between an authenticated user's saved resume and pasted job description text.
 * Authentication required (`protect` middleware on backend).
 *
 * @param {Object} payload - Pasted JD match payload
 * @param {string} payload.resumeId - The 24-hex ObjectId of the user's saved resume
 * @param {string} payload.jobDescription - The job description text (20 - 10,000 characters)
 * @param {string} [payload.jobTitle] - Optional title for the custom job posting
 * @returns {Promise<Object>} Backend ApiResponse { success: true, message: string, data: Object }
 * @throws {Error} If payload is invalid, resumeId is missing, or JD length is out of bounds
 */
export async function matchPastedJdApi(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Match pasted payload must be an object');
  }

  const safeResumeId = validateId(payload.resumeId, 'resume ID');

  if (typeof payload.jobDescription !== 'string') {
    throw new Error('Job description must be a string');
  }

  const trimmedJd = payload.jobDescription.trim();
  if (!trimmedJd) {
    throw new Error('Job description cannot be empty');
  }

  if (trimmedJd.length < MIN_JD_LENGTH) {
    throw new Error(`Job description must be at least ${MIN_JD_LENGTH} characters long`);
  }

  if (trimmedJd.length > MAX_JD_LENGTH) {
    throw new Error(`Job description cannot exceed ${MAX_JD_LENGTH} characters`);
  }

  const requestBody = {
    resumeId: safeResumeId,
    jobDescription: trimmedJd,
  };

  if (payload.jobTitle && typeof payload.jobTitle === 'string' && payload.jobTitle.trim()) {
    requestBody.jobTitle = payload.jobTitle.trim();
  }

  return api.post('/jobs/match-pasted', requestBody);
}
