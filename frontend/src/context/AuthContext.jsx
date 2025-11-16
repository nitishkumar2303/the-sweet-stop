/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api, {
  login as apiLogin,
  register as apiRegister,
} from "../services/api"; // default axios + named helpers

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // single source: token persisted in localStorage
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // keep axios auth header in sync immediately when token changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      localStorage.setItem("token", token);
    } else {
      delete api.defaults.headers.common.Authorization;
      localStorage.removeItem("token");
    }
  }, [token]);

  // persist user object
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  // check auth by calling backend (optionally accept token param to avoid race)
  const checkAuthStatus = useCallback(
    async (tkn = token) => {
      if (!tkn) {
        setUser(null);
        setIsLoading(false);
        return false;
      }

      try {
        // ensure axios header set for this call (covers the setToken race case)
        api.defaults.headers.common.Authorization = `Bearer ${tkn}`;

        // Temporarily disable calling `/auth/me` while the backend endpoint
        // is not available. We'll assume the token is valid if present and
        // rely on other calls to surface auth errors (401 -> auto-logout).
        // const { data } = await apiGetMe();
        // setUser(data);
        setIsLoading(false);
        return true;
      } catch (err) {
        console.error("Authentication failed", err);
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return false;
      }
    },
    [token]
  );

  // run once on mount
  useEffect(() => {
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // login / register with proper error handling
  const login = async (credentials) => {
    const { data } = await apiLogin(credentials);
    const newToken = data.token;
    // set header synchronously and persist token before calling check
    api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    setToken(newToken);
    const ok = await checkAuthStatus(newToken); // pass token explicitly
    if (ok) navigate("/");
    return data;
  };

  const register = async (userData) => {
    const { data } = await apiRegister(userData);
    // if backend returns token on register:
    if (data?.token) {
      const newToken = data.token;
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      setToken(newToken);
      await checkAuthStatus(newToken);
      navigate("/");
    }
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    delete api.defaults.headers.common.Authorization;
    navigate("/login");
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
