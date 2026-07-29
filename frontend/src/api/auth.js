import { api } from './client.js';

/**
 * Register a new user
 * @param {Object} userData - { name, email, password }
 */
export async function signupApi(userData) {
  return api.post('/auth/signup', userData);
}

/**
 * Login user
 * @param {Object} credentials - { email, password }
 */
export async function loginApi(credentials) {
  return api.post('/auth/login', credentials);
}

/**
 * Logout user
 */
export async function logoutApi() {
  return api.post('/auth/logout');
}

/**
 * Fetch current user profile
 */
export async function getMeApi() {
  return api.get('/auth/me');
}

/**
 * Change user password
 * @param {Object} data - { currentPassword, newPassword }
 */
export async function changePasswordApi(data) {
  return api.put('/auth/change-password', data);
}
