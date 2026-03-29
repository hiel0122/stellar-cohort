import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isAllowedDomain, type UserRole } from "@/lib/auth";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  department: string | null;
  title: string | null;
  role: string;
  clearance_level: number;
  allow_pages: string[] | null;
  deny_pages: string[] | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  session: Session | null;
  isAuthenticated: boolean;
  authReady: boolean;
  loading: boolean;
  profileLoading: boolean;
  softError: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  retrySessionSync: () => Promise<void>;
  dismissSoftError: () => void;
  resetSession: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: "pending",
  session: null,
  isAuthenticated: false,
  authReady: false,
  loading: true,
  profileLoading: false,
  softError: null,
  signOut: async () => {},
  refreshProfile: async () => null,
  retrySessionSync: async () => {},
  dismissSoftError: () => {},
  resetSession: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const VALID_ROLES: UserRole[] = ["admin", "education", "marketing", "pending"];
const PROFILE_SELECT = "id, email, full_name, department, title, role, clearance_level, allow_pages, deny_pages";
const AUTH_TIMEOUT_MS = 10_000;
const VISIBILITY_REFRESH_DEBOUNCE_MS = 400;

function toUserRole(raw: string | undefined | null): UserRole {
  if (raw && VALID_ROLES.includes(raw as UserRole)) return raw as UserRole;
  return "pending";
}

async function fetchProfile(userId: string, retries = 3): Promise<Profile | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_SELECT)
        .eq("id", userId)
        .maybeSingle();
      if (data) return data as unknown as Profile;
      if (error && import.meta.env.DEV) console.warn("Profile fetch attempt", i + 1, error.message);
    } catch (e) {
      if (import.meta.env.DEV) console.warn("Profile fetch network error", e);
    }
    if (i < retries - 1) await new Promise((r) => setTimeout(r, 800));
  }
  return null;
}

/** Clear Supabase auth tokens from localStorage to recover from LockManager issues */
function clearSupabaseAuthTokens() {
  try {
    const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID
      ?? (() => {
        try {
          return new URL(import.meta.env.VITE_SUPABASE_URL).host.split(".")[0];
        } catch {
          return null;
        }
      })();
    const storagePrefix = projectRef ? `sb-${projectRef}-auth-token` : "sb-";
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(storagePrefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true); // initial session bootstrap
  const [profileLoading, setProfileLoading] = useState(false); // profile fetch after session
  const [softError, setSoftError] = useState<string | null>(null);
  const initDone = useRef(false);
  const profileLoadRef = useRef<string | null>(null);
  const profileRequestRef = useRef(0);
  const visibilityTimeoutRef = useRef<number | null>(null);
  const visibilityRefreshInFlightRef = useRef(false);
  const safetyTimerRef = useRef<number | null>(null);
  const profileSafetyTimerRef = useRef<number | null>(null);

  const clearSafetyTimer = useCallback(() => {
    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const clearProfileSafetyTimer = useCallback(() => {
    if (profileSafetyTimerRef.current !== null) {
      window.clearTimeout(profileSafetyTimerRef.current);
      profileSafetyTimerRef.current = null;
    }
  }, []);

  const resetAuthState = useCallback(() => {
    profileRequestRef.current += 1;
    profileLoadRef.current = null;
    setSession(null);
    setProfile(null);
    setProfileLoading(false);
  }, []);

  const handleSignOut = useCallback(async () => {
    try { await supabase.auth.signOut(); } catch {}
    resetAuthState();
    setSoftError(null);
    setAuthReady(true);
    setLoading(false);
  }, [resetAuthState]);

  const handleInvalidDomain = useCallback(async (email?: string | null) => {
    if (email) {
      toast.error("회사 계정(@bobusanggroup.com)으로 로그인하세요.");
    }
    try {
      await supabase.auth.signOut();
    } catch {}
    resetAuthState();
    setSoftError(null);
    setAuthReady(true);
    setLoading(false);
  }, [resetAuthState]);

  const loadProfile = useCallback(async (user: User, options?: { force?: boolean }) => {
    if (profileLoadRef.current === user.id && !options?.force) return null;
    profileLoadRef.current = user.id;
    const requestId = ++profileRequestRef.current;
    setProfileLoading(true);
    try {
      const p = await fetchProfile(user.id);
      if (profileRequestRef.current !== requestId) return null;
      if (!p) {
        setSoftError("세션 동기화에 실패했습니다. 다시 시도하거나, 문제가 지속되면 세션 초기화를 진행하세요.");
        if (import.meta.env.DEV) console.warn("Profile not found after retries for", user.id);
        return null;
      }
      setProfile(p);
      setSoftError(null);
      return p;
    } catch (e) {
      if (import.meta.env.DEV) console.warn("loadProfile error", e);
      if (profileRequestRef.current === requestId) {
        setSoftError("세션 동기화에 실패했습니다. 다시 시도하거나, 문제가 지속되면 세션 초기화를 진행하세요.");
      }
      return null;
    } finally {
      if (profileRequestRef.current === requestId) {
        setProfileLoading(false);
        profileLoadRef.current = null;
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const currentUser = session?.user;
    if (!currentUser) return null;
    return loadProfile(currentUser, { force: true });
  }, [loadProfile, session]);

  const retrySessionSync = useCallback(async () => {
    if (visibilityRefreshInFlightRef.current) return;
    visibilityRefreshInFlightRef.current = true;
    setSoftError(null);
    try {
      const { data: { session: nextSession }, error } = await supabase.auth.getSession();
      if (error) throw error;

      setSession(nextSession);

      if (!nextSession?.user) {
        setProfile(null);
        setSoftError(null);
        return;
      }

      if (!isAllowedDomain(nextSession.user.email)) {
        await handleInvalidDomain(nextSession.user.email);
        return;
      }

      await loadProfile(nextSession.user, { force: true });
    } catch (e: any) {
      if (import.meta.env.DEV) console.warn("session sync failed", e);
      setSoftError("세션 동기화에 실패했습니다. 다시 시도하거나, 문제가 지속되면 세션 초기화를 진행하세요.");
    } finally {
      visibilityRefreshInFlightRef.current = false;
      setLoading(false);
      setAuthReady(true);
    }
  }, [handleInvalidDomain, loadProfile]);

  const dismissSoftError = useCallback(() => {
    setSoftError(null);
  }, []);

  const resetSession = useCallback(() => {
    clearSupabaseAuthTokens();
    window.location.reload();
  }, []);

  const handleVisibilityRefresh = useCallback(async () => {
    if (loading || profileLoading || !session?.user) return;
    await retrySessionSync();
  }, [loading, profileLoading, retrySessionSync, session]);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    safetyTimerRef.current = window.setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          if (import.meta.env.DEV) console.warn("Auth safety timeout — forcing loading=false");
          setSoftError("세션 동기화에 실패했습니다. 다시 시도하거나, 문제가 지속되면 세션 초기화를 진행하세요.");
          setProfileLoading(false);
          setAuthReady(true);
          return false;
        }
        return prev;
      });
    }, AUTH_TIMEOUT_MS);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (import.meta.env.DEV) console.warn("Auth event:", event);

        if (event === "SIGNED_OUT") {
          resetAuthState();
          setSoftError(null);
          setAuthReady(true);
          setLoading(false);
          return;
        }

        setSession(newSession);
        if (!newSession) {
          setProfile(null);
        }
        if (newSession) {
          setSoftError(null);
        }
      }
    );

    void supabase.auth.getSession()
      .then(({ data: { session: s }, error }) => {
        if (error) throw error;
        setSession(s);
        if (!s) setProfile(null);
        setSoftError(null);
      })
      .catch((e: any) => {
        if (import.meta.env.DEV) console.warn("getSession promise rejection", e);
        setSoftError("세션 동기화에 실패했습니다. 다시 시도하거나, 문제가 지속되면 세션 초기화를 진행하세요.");
      })
      .finally(() => {
        setAuthReady(true);
        setLoading(false);
      });

    return () => {
      clearSafetyTimer();
      clearProfileSafetyTimer();
      subscription.unsubscribe();
    };
  }, [clearProfileSafetyTimer, clearSafetyTimer, resetAuthState]);

  useEffect(() => {
    if (!loading) {
      clearSafetyTimer();
    }
  }, [clearSafetyTimer, loading]);

  useEffect(() => {
    clearProfileSafetyTimer();

    if (!profileLoading) return;

    profileSafetyTimerRef.current = window.setTimeout(() => {
      if (import.meta.env.DEV) console.warn("Profile safety timeout — forcing profileLoading=false");
      setProfileLoading(false);
      setSoftError("세션 동기화에 실패했습니다. 다시 시도하거나, 문제가 지속되면 세션 초기화를 진행하세요.");
    }, AUTH_TIMEOUT_MS);

    return clearProfileSafetyTimer;
  }, [clearProfileSafetyTimer, profileLoading]);

  useEffect(() => {
    const currentUser = session?.user;

    if (!currentUser) {
      profileRequestRef.current += 1;
      profileLoadRef.current = null;
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    if (!authReady) return;

    if (profile?.id && profile.id !== currentUser.id) {
      setProfile(null);
    }

    if (!isAllowedDomain(currentUser.email)) {
      void handleInvalidDomain(currentUser.email);
      return;
    }

    void loadProfile(currentUser);
  }, [authReady, handleInvalidDomain, loadProfile, profile?.id, session]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (visibilityTimeoutRef.current !== null) {
        window.clearTimeout(visibilityTimeoutRef.current);
      }
      visibilityTimeoutRef.current = window.setTimeout(() => {
        void handleVisibilityRefresh();
      }, VISIBILITY_REFRESH_DEBOUNCE_MS);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (visibilityTimeoutRef.current !== null) {
        window.clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, [handleVisibilityRefresh]);

  const user = session?.user ?? null;
  // CRITICAL: only derive role when profile is actually loaded
  const role: UserRole = profile ? toUserRole(profile.role) : "pending";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        session,
        isAuthenticated: !!user,
        authReady,
        loading,
        profileLoading,
        softError,
        signOut: handleSignOut,
        refreshProfile,
        retrySessionSync,
        dismissSoftError,
        resetSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
