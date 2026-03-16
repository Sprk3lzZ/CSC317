"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken, getMe, logout as apiLogout } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: () => {},
  setUser: () => {},
});

const PUBLIC_PATHS = ["/login", "/register"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    async function init() {
      const token = getToken();

      if (!token) {
        setLoading(false);
        if (!isPublic) router.replace("/login");
        return;
      }

      // Try to restore from localStorage first (instant)
      const cached = localStorage.getItem("ef-user");
      if (cached) {
        try {
          setUser(JSON.parse(cached) as User);
        } catch {
          // ignore
        }
      }

      // Then refresh from server
      try {
        const me = await getMe();
        setUser(me);
        localStorage.setItem("ef-user", JSON.stringify(me));
      } catch {
        // Token invalid
        apiLogout();
        setUser(null);
        if (!isPublic) router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect away from auth pages if already logged in
  useEffect(() => {
    if (!loading && user && isPublic) {
      router.replace("/dashboard");
    }
  }, [loading, user, isPublic, router]);

  // Redirect to login if no user on protected pages
  useEffect(() => {
    if (!loading && !user && !isPublic) {
      router.replace("/login");
    }
  }, [loading, user, isPublic, router]);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
