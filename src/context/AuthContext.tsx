import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "parent" | "teacher" | "manager" | "principal" | "cashier" | "exam_incharge";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  session: string;
  setSession: (session: string) => void;
  sessionOptions: string[];
  loadSessions: () => Promise<void>;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getCurrentSession(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 3) {
    return `${year}-${String(year + 1).slice(2)}`;
  }
  return `${year - 1}-${String(year).slice(2)}`;
}

const DEFAULT_SESSIONS = ["2024-25", "2025-26", "2026-27"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<string>(getCurrentSession());
  const [sessionOptions, setSessionOptions] = useState<string[]>(DEFAULT_SESSIONS);

  const loadSessions = async () => {
    try {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "academic_sessions").maybeSingle();
      if (data?.value) {
        const parsed = JSON.parse(data.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessionOptions(parsed);
          if (!parsed.includes(session)) {
            setSession(parsed[parsed.length - 1]);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const login = (user: AuthUser, token: string) => {
    setUser(user);
    setToken(token);
  };
  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, session, setSession, sessionOptions, loadSessions, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
