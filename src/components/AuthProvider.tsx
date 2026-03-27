import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isAllowedDomain, type UserRole } from "@/lib/auth";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, LogOut, Trash2 } from "lucide-react";

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
  loading: boolean;
  profileLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: "pending",
  session: null,
  isAuthenticated: false,
  loading: true,
  profileLoading: false,
  signOut: async () => {},
  refreshProfile: async () => null,
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
  const [loading, setLoading] = useState(true); // initial session bootstrap
  const [profileLoading, setProfileLoading] = useState(false); // profile fetch after session
  const [authError, setAuthError] = useState<string | null>(null);
  const initDone = useRef(false);
  const profileLoadRef = useRef<string | null>(null);
  const profileRequestRef = useRef(0);
  const visibilityTimeoutRef = useRef<number | null>(null);
  const visibilityRefreshInFlightRef = useRef(false);
  const safetyTimerRef = useRef<number | null>(null);

  const clearSafetyTimer = useCallback(() => {
    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
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
    setAuthError(null);
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
    setAuthError(null);
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
      setProfile(p);
      if (!p) {
        setAuthError("세션 로딩 실패(일시적). 프로필을 다시 불러와주세요.");
        if (import.meta.env.DEV) console.warn("Profile not found after retries for", user.id);
        return null;
      }
      setAuthError(null);
      return p;
    } catch (e) {
      if (import.meta.env.DEV) console.warn("loadProfile error", e);
      if (profileRequestRef.current === requestId) {
        setProfile(null);
        setAuthError("세션 로딩 실패(일시적). 프로필을 다시 불러와주세요.");
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

  const refreshSession = useCallback(async () => {
    const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    setSession(refreshedSession);
    if (!refreshedSession) setProfile(null);
    return refreshedSession;
  }, [session]);

  const handleRetry = useCallback(async () => {
    setAuthError(null);
    setLoading(true);
    try {
      let nextSession: Session | null = null;

      try {
        nextSession = await refreshSession();
      } catch (refreshError) {
        if (import.meta.env.DEV) console.warn("refreshSession retry failed", refreshError);
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        nextSession = existingSession;
        setSession(existingSession);
      }

      if (nextSession?.user) {
        if (!isAllowedDomain(nextSession.user.email)) {
          await handleInvalidDomain(nextSession.user.email);
          return;
        }
        await loadProfile(nextSession.user, { force: true });
      }
    } catch (e: any) {
      setAuthError(e?.message || "세션 로딩 실패(일시적). 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }, [handleInvalidDomain, loadProfile, refreshSession]);

  const handleSessionReset = useCallback(() => {
    clearSupabaseAuthTokens();
    window.location.reload();
  }, []);

  const handleVisibilityRefresh = useCallback(async () => {
    if (visibilityRefreshInFlightRef.current || loading || profileLoading || !session?.user) return;

    visibilityRefreshInFlightRef.current = true;
    try {
      const refreshedSession = await refreshSession();
      if (refreshedSession?.user) {
        if (!isAllowedDomain(refreshedSession.user.email)) {
          await handleInvalidDomain(refreshedSession.user.email);
          return;
        }
        await loadProfile(refreshedSession.user, { force: true });
      }
    } catch (e: any) {
      if (import.meta.env.DEV) console.warn("visibility refresh failed", e);
      setAuthError(e?.message || "세션 로딩 실패(일시적). 다시 시도해주세요.");
    } finally {
      visibilityRefreshInFlightRef.current = false;
    }
  }, [handleInvalidDomain, loadProfile, loading, profileLoading, refreshSession, session]);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    safetyTimerRef.current = window.setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          if (import.meta.env.DEV) console.warn("Auth safety timeout — forcing loading=false");
          setAuthError("세션 로딩 실패(일시적). 다시 시도해주세요.");
          setProfileLoading(false);
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
          setAuthError(null);
          setLoading(false);
          return;
        }

        setSession(newSession);
        if (!newSession) {
          setProfile(null);
        }
        if (newSession) {
          setAuthError(null);
        }
        setLoading(false);
      }
    );

    void supabase.auth.getSession()
      .then(({ data: { session: s }, error }) => {
        if (error) throw error;
        setSession(s);
        if (!s) setProfile(null);
      })
      .catch((e: any) => {
        if (import.meta.env.DEV) console.warn("getSession promise rejection", e);
        setAuthError(e?.message || "세션 로딩 실패(일시적). 다시 시도해주세요.");
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      clearSafetyTimer();
      subscription.unsubscribe();
    };
  }, [clearSafetyTimer, resetAuthState]);

  useEffect(() => {
    if (!loading) {
      clearSafetyTimer();
    }
  }, [clearSafetyTimer, loading]);

  useEffect(() => {
    const currentUser = session?.user;

    if (!currentUser) {
      profileRequestRef.current += 1;
      profileLoadRef.current = null;
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    if (!isAllowedDomain(currentUser.email)) {
      void handleInvalidDomain(currentUser.email);
      return;
    }

    void loadProfile(currentUser);
  }, [handleInvalidDomain, loadProfile, session]);

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

  // Error fallback UI
  if (!loading && authError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-lg">세션 로딩 실패(일시적)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">{authError}</p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleRetry} className="w-full gap-2" variant="default">
                <RefreshCw className="h-4 w-4" />
                다시 시도
              </Button>
              <Button onClick={handleSessionReset} className="w-full gap-2" variant="outline">
                <Trash2 className="h-4 w-4" />
                세션 초기화 (권장)
              </Button>
              <Button onClick={handleSignOut} className="w-full gap-2" variant="ghost">
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        session,
        isAuthenticated: !!user,
        loading,
        profileLoading,
        signOut: handleSignOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
