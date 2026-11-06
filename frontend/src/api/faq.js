import { api } from './client.js';

/**
 * Fetch FAQs from the backend catalogue.
 * Supports optional category filtering.
 *
 * Supported category enum values in the backend model:
 * - 'getting-started'
 * - 'resume-analyzer'
 * - 'job-matching'
 * - 'cv-templates'
 * - 'skill-assessment'
 *
 * @param {Object|string} [params={}] - Optional query params object { category } or category string
 * @returns {Promise<Object>} Backend ApiResponse { success: true, message: string, data: { faqs: Array } }
 */
export async function getFAQsApi(params = {}) {
  const category = typeof params === 'string' ? params.trim() : params?.category?.trim?.();

  let endpoint = '/faqs';
  if (category && category.toLowerCase() !== 'all') {
    endpoint += `?category=${encodeURIComponent(category)}`;
  }

  return api.get(endpoint);
}

