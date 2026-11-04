import { api } from './client.js';

/**
 * Fetch the curated skills taxonomy for a given career role.
 *
 * Supported role slugs include:
 * - 'frontend-developer'
 * - 'backend-developer'
 * - 'data-scientist'
 * - 'full-stack-developer'
 * - 'devops-engineer'
 *
 * Note: The backend safely defaults unrecognized role slugs to 'full-stack-developer'.
 *
 * @param {string} role - Career role slug identifier (e.g. 'frontend-developer')
 * @returns {Promise<Object>} Backend ApiResponse { success: true, message: 'Success', data: { taxonomy: { role: string, skills: Array } } }
 * @throws {Error} If role slug is missing, not a string, or empty
 */
export async function getSkillsTaxonomyApi(role) {
  if (!role || typeof role !== 'string' || !role.trim()) {
    throw new Error('A valid role slug is required');
  }

  return api.get(`/skills/taxonomy/${encodeURIComponent(role.trim())}`);
}

/**
 * Alias export for getSkillsTaxonomyApi to ensure compatibility across naming conventions.
 */
export const getSkillTaxonomyApi = getSkillsTaxonomyApi;

/**
 * Perform skill gap analysis comparing a user's current skills against a target role.
 *
 * Supported by backend AI service (OpenAI) with transparent NLP fallback.
 * Both paths return an identical response structure.
 *
 * @param {Object} data - Skill gap request payload
 * @param {string[]} data.currentSkills - Array of current skill names (non-empty strings)
 * @param {string} data.targetRole - Target career role or title (non-empty string)
 * @returns {Promise<Object>} Backend ApiResponse { success: true, message: 'Success', data: { gaps: Array<{ skill: string, priority: string, resource: string }>, targetRole: string } }
 * @throws {Error} If payload, currentSkills, or targetRole fails pre-flight validation
 */
export async function analyzeSkillGapApi(data = {}) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Skill gap analysis payload must be an object');
  }

  const { currentSkills, targetRole } = data;

  if (!Array.isArray(currentSkills) || currentSkills.length === 0) {
    throw new Error('currentSkills must be a non-empty array of strings');
  }

  for (const skill of currentSkills) {
    if (typeof skill !== 'string' || !skill.trim()) {
      throw new Error('All skills in currentSkills must be non-empty strings');
    }
  }

  if (!targetRole || typeof targetRole !== 'string' || !targetRole.trim()) {
    throw new Error('targetRole is required and must be a non-empty string');
  }

  const payload = {
    currentSkills: currentSkills.map((s) => s.trim()),
    targetRole: targetRole.trim(),
  };

  return api.post('/skills/gap-analysis', payload);
}

