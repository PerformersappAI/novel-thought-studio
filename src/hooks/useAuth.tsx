import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type UserRole = "performer" | "producer" | "admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  legalAccepted: boolean | null;
  signUp: (email: string, password: string, fullName: string, meta?: Record<string, string>) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  markLegalAccepted: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [legalAccepted, setLegalAccepted] = useState<boolean | null>(null);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    setRole((data?.role as UserRole) ?? "performer");
  };

  const fetchLegalStatus = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("legal_accepted_at")
      .eq("user_id", userId)
      .maybeSingle();
    setLegalAccepted(!!data?.legal_accepted_at);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchRole(session.user.id);
            fetchLegalStatus(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setLegalAccepted(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
        fetchLegalStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, meta?: Record<string, string>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, ...meta },
        emailRedirectTo: window.location.origin + '/dashboard',
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const markLegalAccepted = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ legal_accepted_at: new Date().toISOString() } as any).eq("user_id", user.id);
    setLegalAccepted(true);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, legalAccepted, signUp, signIn, signOut, markLegalAccepted }}>
      {children}
    </AuthContext.Provider>
  );
};
