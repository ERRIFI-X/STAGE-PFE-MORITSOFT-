import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";


export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor to inject Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor to handle global UNAUTHORIZED (401)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes('/auth');
    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Token expired or invalid (not a login attempt), clear localStorage and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default function useCrud(endpoint) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // GET ALL
  const getAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get(`/${endpoint}`);
      const responseData = res.data.data !== undefined ? res.data.data : res.data;
      setData(responseData);
      return responseData;
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Error fetching data";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  // GET BY ID
  const getById = useCallback(
    async (id) => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(`/${endpoint}?id=${id}`);
        return  res.data;
      } catch (err) {
        const message =
          err.response?.data?.message || err.message || "Error fetching item";
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [endpoint],
  );

  // CREATE
  const create = useCallback(
    async (item) => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.post(`/${endpoint}`, item);
        const newItem = res.data;

        // Optimistic update
        setData((prev) => [newItem, ...prev]);

        return newItem;
      } catch (err) {
        const data = err.response?.data;
        let message = "Erreur de création";
        
        if (data?.errors && Array.isArray(data.errors)) {
          message = data.errors.join(" | ");
        } else if (data?.error) {
          message = data.error;
        } else if (data?.message) {
          message = data.message;
        } else {
          message = err.message || message;
        }

        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [endpoint],
  );

  // UPDATE
  const update = useCallback(
    async (id, item) => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.put(`/${endpoint}?id=${id}`, item);
        const updatedItem = res.data;

        // Optimistic update
        setData((prev) =>
          prev.map((item) => (item.id === id ? updatedItem : item)),
        );

        return updatedItem;
      } catch (err) {
        const message = err.response?.data?.message || err.message || "Error updating item";
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [endpoint],
  );

  // DELETE
  const remove = useCallback(
    async (id) => {
      try {
        setLoading(true);
        setError(null);

        await api.delete(`/${endpoint}?id=${id}`, { data: { id } });

        // Optimistic update
        setData((prev) => prev.filter((item) => item.id !== id));

        return true;
      } catch (err) {
        const message =
          err.response?.data?.error || err.response?.data?.message || err.message || "Error deleting item";
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [endpoint],
  );

  // REFRESH
  const refresh = useCallback(() => {
    return getAll();
  }, [getAll]);

  // Load initial data
  useEffect(() => {
    getAll();
  }, [getAll]);

  return {
    data,
    loading,
    error,
    getAll,
    getById,
    create,
    update,
    remove,
    refresh
  };
}
