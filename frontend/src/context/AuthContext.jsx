import { createContext, useState, useEffect } from 'react';
import { loginApi, signupApi, logoutApi, getMeApi } from '../api/auth.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Session bootstrap: Check if existing session/token is valid on initial mount
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const response = await getMeApi();
        if (isMounted && response?.success && response?.data?.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        // Token invalid or missing, clear stored token
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('token');
        }
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await loginApi({ email, password });
      if (response?.success && response?.data) {
        const { user: userData, token } = response.data;
        if (token && typeof localStorage !== 'undefined') {
          localStorage.setItem('token', token);
        }
        setUser(userData);
        return { success: true, user: userData };
      }
      return { success: false, message: response?.message || 'Login failed' };
    } catch (error) {
      return { success: false, message: error.message || 'Invalid email or password' };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    try {
      const response = await signupApi({ name, email, password });
      if (response?.success && response?.data) {
        const { user: userData, token } = response.data;
        if (token && typeof localStorage !== 'undefined') {
          localStorage.setItem('token', token);
        }
        setUser(userData);
        return { success: true, user: userData };
      }
      return { success: false, message: response?.message || 'Signup failed' };
    } catch (error) {
      return { success: false, message: error.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      // Ignore network errors on logout
    } finally {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token');
      }
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
