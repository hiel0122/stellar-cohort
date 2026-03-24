import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isAllowedDomain, type UserRole } from "@/lib/auth";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  role: UserRole;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: "admin",
  session: null,
  isAuthenticated: false,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  useEffect(() => {
    // Listen first, then get session (per Supabase docs)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (event === "SIGNED_IN" && newSession?.user) {
          if (!isAllowedDomain(newSession.user.email)) {
            toast.error("@bobusanggroup.com 계정만 로그인할 수 있어요.");
            await supabase.auth.signOut();
            setSession(null);
            setLoading(false);
            return;
          }
        }
        setSession(newSession);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s?.user && !isAllowedDomain(s.user.email)) {
        supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(s);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const user = session?.user ?? null;
  // Default role — will be replaced with profiles lookup later
  const role: UserRole = "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
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
