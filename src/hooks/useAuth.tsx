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
  refreshAccess: () => Promise<void>;
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

  const loadUserAccess = async (userId: string) => {
    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || authData.user?.id !== userId) {
      setSession(null);
      setUser(null);
      setRole(null);
      setLegalAccepted(null);
      setLoading(false);
      return;
    }
    const [{ data: roleData }, { data: profileData, error: profileError }] = await Promise.all([
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("legal_accepted_at")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    setRole((roleData?.role as UserRole) ?? "performer");
    if (profileError) console.warn("Profile access check failed:", profileError);
    setLegalAccepted(profileError ? true : !!profileData?.legal_accepted_at);
    setLoading(false);
  };

  const refreshAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);
    if (session?.user) await loadUserAccess(session.user.id);
    else setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "INITIAL_SESSION") return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            if (mounted) loadUserAccess(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setLegalAccepted(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserAccess(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return { error: error as Error | null };
    }
    setSession(data.session);
    setUser(data.user);
    if (data.user) await loadUserAccess(data.user.id);
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
    setLegalAccepted(null);
    setLoading(false);
  };

  const markLegalAccepted = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ legal_accepted_at: new Date().toISOString() } as any).eq("user_id", user.id);
    setLegalAccepted(true);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, legalAccepted, refreshAccess, signUp, signIn, signOut, markLegalAccepted }}>
      {children}
    </AuthContext.Provider>
  );
};
