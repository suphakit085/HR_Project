"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";
import api, { authAPI } from "./api";

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; full_name: string; role: string }) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      authAPI
        .getMe()
        .then((res) => setUser(res.data))
        .catch(() => {
          Cookies.remove("token");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authAPI.login({ email, password });
    const token = res.data.access_token;
    Cookies.set("token", token, { expires: 1, path: "/" });
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    const meRes = await api.get("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUser(meRes.data);
    return meRes.data;
  };

  const register = async (data: { email: string; password: string; full_name: string; role: string }) => {
    await authAPI.register(data);
  };

  const logout = () => {
    Cookies.remove("token", { path: "/" });
    delete api.defaults.headers.common.Authorization;
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, isAdmin: user?.role === "admin" }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
