import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/api";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (savedUser && token) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    return !!(savedUser && token);
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (user && token) {
      localStorage.setItem("user", JSON.stringify(user));
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setIsAuthenticated(false);
    }
  }, [user]);

  const login = async (userData, role) => {
    try {
      const response = await api.post(`/auth?action=${role}login`, userData);
      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        // The user object contains {id, username, name, role, is_tester}
        setUser(response.data.user);
        return { success: true, role: response.data.user.role, is_tester: response.data.user.is_tester };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const resetTesterSandbox = async () => {
    try {
      const response = await api.post(`/auth?action=reset_tester`);
      return response.data;
    } catch (error) {
      console.error("Reset tester failed:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';
  const isTester = Boolean(user?.is_tester);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, isAdmin, isClient, isTester, resetTesterSandbox }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
