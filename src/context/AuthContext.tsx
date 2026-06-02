import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export type UserRole = "parent" | "teacher" | "manager" | "principal" | "cashier" | "exam_incharge";

export interface AuthUser {
  id: string;          // student_id for parents, staff_id for staff (preserves legacy contract)
  authUserId: string;  // auth.users.id
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;            // Supabase access token
  session: string;                  // academic session (e.g. "2026-27")
  setSession: (s: string) => void;
  sessionOptions: string[];
  loadSessions: () => Promise<void>;
  login: (u: AuthUser, token: string) => void;   // legacy no-op for older callers
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getCurrentSession(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 3) return `${year}-${String(year + 1).slice(2)}`;
  return `${year - 1}-${String(year).slice(2)}`;
}

const DEFAULT_SESSIONS = ["2024-25", "2025-26", "2026-27"];

async function buildAuthUser(supabaseSession: Session): Promise<AuthUser | null> {
  const authUserId = supabaseSession.user.id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, student_id, staff_id")
    .eq("user_id", authUserId)
    .maybeSingle();
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", authUserId);
  if (!roles || roles.length === 0) return null;
  // Prefer staff role over parent if both somehow exist
  const role = (roles.find((r) => r.role !== "parent")?.role ?? roles[0].role) as UserRole;
  const id = role === "parent"
    ? (profile?.student_id ?? authUserId)
    : (profile?.staff_id ?? authUserId);
  return {
    id,
    authUserId,
    name: profile?.full_name || supabaseSession.user.email || "User",
    role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<string>(getCurrentSession());
  const [sessionOptions, setSessionOptions] = useState<string[]>(DEFAULT_SESSIONS);

  const loadSessions = async () => {
    try {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "academic_sessions").maybeSingle();
      if (data?.value) {
        const parsed = JSON.parse(data.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessionOptions(parsed);
          if (!parsed.includes(session)) setSession(parsed[parsed.length - 1]);
        }
      }
    } catch (e) { console.error("Failed to load sessions", e); }
  };

  useEffect(() => {
    // 1. Register listener FIRST to catch any auth events
    const { data: sub } = supabase.auth.onAuthStateChange((_event, supabaseSession) => {
      setToken(supabaseSession?.access_token ?? null);
      if (!supabaseSession) {
        setUser(null);
        return;
      }
      // Defer Supabase reads to avoid deadlocks in the callback
      setTimeout(async () => {
        const built = await buildAuthUser(supabaseSession);
        setUser(built);
      }, 0);
    });

    // 2. Then check the existing session
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        setToken(data.session.access_token);
        const built = await buildAuthUser(data.session);
        setUser(built);
      }
      setLoading(false);
    });

    loadSessions();

    return () => { sub.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Legacy method kept so older callers that imported `login()` don't break.
  // Real authentication now happens via supabase.auth.signInWithPassword in LoginPage.
  const login = (_u: AuthUser, _t: string) => { /* no-op */ };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, session, setSession, sessionOptions, loadSessions, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
