import { api } from './client.js';

/**
 * Fetch the template catalogue.
 * Supports optional category filtering.
 *
 * @param {Object|string} [params={}] - Optional query params object { category } or category string
 * @returns {Promise<Object>} Backend ApiResponse { success: true, message: 'Success', data: { templates: [...] } }
 */
export async function getTemplatesApi(params = {}) {
  const category = typeof params === 'string' ? params.trim() : params?.category?.trim?.();

  let endpoint = '/templates';
  if (category && category !== 'all') {
    endpoint += `?category=${encodeURIComponent(category)}`;
  }

  return api.get(endpoint);
}

/**
 * Fetch a single template by its unique slug.
 *
 * @param {string} slug - Unique template slug identifier (e.g. 'modern-professional')
 * @returns {Promise<Object>} Backend ApiResponse { success: true, message: 'Success', data: { template: {...} } }
 */
export async function getTemplateBySlugApi(slug) {
  if (!slug || typeof slug !== 'string' || !slug.trim()) {
    throw new Error('A valid template slug is required');
  }

  return api.get(`/templates/${encodeURIComponent(slug.trim())}`);
}
