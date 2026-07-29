const BASE_URL = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_URL)
  || (typeof process !== 'undefined' && process.env?.VITE_API_URL)
  || 'http://localhost:5000/api/v1';

/**
 * Custom HTTP client for ResuPrep API
 */
export async function apiClient(endpoint, options = {}) {
  const {
    body,
    headers = {},
    customConfig = {},
    method = 'GET',
  } = options;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

  const config = {
    method,
    credentials: 'include',
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    ...customConfig,
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data.message || data.error || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (!error.status) {
      error.message = error.message || 'Network error, please check your backend connection';
    }
    throw error;
  }
}

export const api = {
  get: (endpoint, options = {}) => apiClient(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => apiClient(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => apiClient(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) => apiClient(endpoint, { ...options, method: 'DELETE' }),
};
