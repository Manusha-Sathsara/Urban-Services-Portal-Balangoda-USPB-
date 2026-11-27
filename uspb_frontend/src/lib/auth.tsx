"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ApiResponse, AuthResponse, User, UserRole } from "@/types";

export const dashboardByRole: Record<UserRole, string> = {
  ADMIN: "/admin",
  FEE_OFFICER: "/garbage-fees",
  ENV_OFFICER: "/environmental",
  GARBAGE_SUPERVISOR: "/schools",
  TEACHER: "/schools",
};

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const res = await api.get<ApiResponse<{ user: User }>>("/auth/me");
      const loaded = res.data.data?.user ?? null;
      setUser(loaded);
      return loaded;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get<ApiResponse<{ user: User }>>("/auth/me")
      .then((res) => {
        if (active) setUser(res.data.data?.user ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<User> => {
    const res = await api.post<ApiResponse<AuthResponse>>("/auth/login", {
      username,
      password,
    });
    const loggedInUser = res.data.data?.user;
    if (!loggedInUser) {
      throw new Error("Invalid authentication response");
    }
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
