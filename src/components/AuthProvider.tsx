import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isAllowedDomain, type UserRole } from "@/lib/auth";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, LogOut } from "lucide-react";

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
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: "pending",
  session: null,
  isAuthenticated: false,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const VALID_ROLES: UserRole[] = ["admin", "education", "marketing", "pending"];

function toUserRole(raw: string | undefined | null): UserRole {
  if (raw && VALID_ROLES.includes(raw as UserRole)) return raw as UserRole;
  return "pending";
}

async function fetchProfile(userId: string, retries = 3): Promise<Profile | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, department, title, role, clearance_level, allow_pages, deny_pages")
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const profileLoadRef = useRef<string | null>(null);
  const initDone = useRef(false);

  const handleSignOut = useCallback(async () => {
    try { await supabase.auth.signOut(); } catch {}
    setSession(null);
    setProfile(null);
    setAuthError(null);
  }, []);

  const loadProfile = useCallback(async (user: User) => {
    if (profileLoadRef.current === user.id) return;
    profileLoadRef.current = user.id;
    try {
      const p = await fetchProfile(user.id);
      setProfile(p);
      if (!p) {
        if (import.meta.env.DEV) console.warn("Profile not found after retries for", user.id);
      }
    } catch (e) {
      if (import.meta.env.DEV) console.warn("loadProfile error", e);
    } finally {
      profileLoadRef.current = null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const currentUser = session?.user;
    if (!currentUser) return;
    profileLoadRef.current = null;
    const p = await fetchProfile(currentUser.id, 1);
    if (p) setProfile(p);
  }, [session]);

  const handleRetry = useCallback(async () => {
    setAuthError(null);
    setLoading(true);
    try {
      const { data: { session: s }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (s?.user) {
        if (!isAllowedDomain(s.user.email)) {
          toast.error("@bobusanggroup.com 계정만 로그인할 수 있어요.");
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
        } else {
          setSession(s);
          await loadProfile(s.user);
        }
      }
    } catch (e: any) {
      setAuthError(e?.message || "세션 초기화에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    // Safety timeout — never spin forever
    const safetyTimer = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          if (import.meta.env.DEV) console.warn("Auth safety timeout — forcing loading=false");
          setAuthError("세션 로딩 시간이 초과되었습니다. 다시 시도해주세요.");
          return false;
        }
        return prev;
      });
    }, 10_000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        try {
          if (import.meta.env.DEV) console.warn("Auth event:", event, "origin:", window.location.origin);

          if (event === "SIGNED_IN" && newSession?.user) {
            if (!isAllowedDomain(newSession.user.email)) {
              toast.error("@bobusanggroup.com 계정만 로그인할 수 있어요.");
              await supabase.auth.signOut();
              setSession(null);
              setProfile(null);
              setLoading(false);
              return;
            }
            setSession(newSession);
            await loadProfile(newSession.user);
            setLoading(false);
            return;
          }
          if (event === "SIGNED_OUT") {
            setSession(null);
            setProfile(null);
          } else if (newSession) {
            setSession(newSession);
          }
        } catch (e: any) {
          if (import.meta.env.DEV) console.warn("onAuthStateChange error", e);
          setAuthError(e?.message || "인증 상태 변경 중 오류가 발생했습니다.");
        } finally {
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: s }, error }) => {
      try {
        if (error) {
          if (import.meta.env.DEV) console.warn("getSession error:", error.message);
          setAuthError(error.message);
          setLoading(false);
          return;
        }
        if (s?.user && !isAllowedDomain(s.user.email)) {
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
        } else if (s?.user) {
          setSession(s);
          await loadProfile(s.user);
        }
      } catch (e: any) {
        if (import.meta.env.DEV) console.warn("getSession handler error", e);
        setAuthError(e?.message || "세션 초기화에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }).catch((e: any) => {
      if (import.meta.env.DEV) console.warn("getSession promise rejection", e);
      setAuthError(e?.message || "세션 초기화에 실패했습니다.");
      setLoading(false);
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const user = session?.user ?? null;
  const role: UserRole = toUserRole(profile?.role);

  // Error fallback UI
  if (!loading && authError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-lg">세션 초기화 실패</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">{authError}</p>
            <div className="flex gap-3">
              <Button onClick={handleRetry} className="flex-1 gap-2" variant="default">
                <RefreshCw className="h-4 w-4" />
                다시 시도
              </Button>
              <Button onClick={handleSignOut} className="flex-1 gap-2" variant="outline">
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
        signOut: handleSignOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
