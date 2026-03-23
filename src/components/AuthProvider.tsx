import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { type AuthUser, type UserRole, getStoredUser, storeUser, clearUser, mockSignIn } from "@/lib/auth";

interface AuthContextType {
  user: AuthUser | null;
  signIn: (role?: UserRole) => void;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  signIn: () => {},
  signOut: () => {},
  isAuthenticated: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  const signIn = useCallback((role: UserRole = "admin") => {
    const u = mockSignIn(role);
    setUser(u);
  }, []);

  const signOut = useCallback(() => {
    clearUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
