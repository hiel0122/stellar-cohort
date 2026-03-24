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
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: "pending",
  session: null,
  isAuthenticated: false,
  loading: true,
  signOut: async () => {},
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
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, department, title, role")
      .eq("id", userId)
      .maybeSingle();
    if (data) return data as Profile;
    if (error) console.warn("Profile fetch error:", error.message);
    if (i < retries - 1) await new Promise((r) => setTimeout(r, 1000));
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileLoadRef = useRef<string | null>(null);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const loadProfile = useCallback(async (user: User) => {
    if (profileLoadRef.current === user.id) return;
    profileLoadRef.current = user.id;
    const p = await fetchProfile(user.id);
    setProfile(p);
    profileLoadRef.current = null;
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
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
        } else {
          setSession(newSession);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (s?.user && !isAllowedDomain(s.user.email)) {
        supabase.auth.signOut();
        setSession(null);
        setProfile(null);
      } else if (s?.user) {
        setSession(s);
        await loadProfile(s.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const user = session?.user ?? null;
  const role: UserRole = toUserRole(profile?.role);

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
