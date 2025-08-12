import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  companyId: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, companyName?: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => {
          void ensureProfileAndCompany(sess.user);
        }, 0);
      } else {
        setCompanyId(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        void ensureProfileAndCompany(session.user);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ensureProfileAndCompany(u: User) {
    // 1) Fetch profile
    const { data: profile, error } = await supabase
      .from("users_profiles")
      .select("id, company_id")
      .eq("id", u.id)
      .maybeSingle();

    if (error) return; // ignore silently

    if (profile?.company_id) {
      setCompanyId(profile.company_id);
      return;
    }

    // 2) Create a company for this user if not present
    const defaultName = (u.email?.split("@")[0] || "Mi Empresa").slice(0, 80);
    const { data: company, error: compErr } = await supabase
      .from("companies")
      .insert({ owner_user_id: u.id, name: defaultName })
      .select("id")
      .maybeSingle();

    if (compErr || !company?.id) return;

    try {
      const { data: up } = await supabase
        .from("users_profiles")
        .upsert({ id: u.id, company_id: company.id })
        .select("company_id")
        .maybeSingle();
      const cid = up?.company_id ?? company.id;
      setCompanyId(cid);
    } catch (_) {
      // ignore
    }
  }

  const signIn: AuthContextType["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      setTimeout(async () => {
        try { await supabase.rpc('audit_log', { _event_type: 'auth_login', _company_id: null, _subject_id: null, _message: 'Inicio de sesión', _details: {} }); } catch {}
      }, 0);
    }
    return { error };
  };

  const signUp: AuthContextType["signUp"] = async (email, password, companyName) => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });

    // When session is available immediately (email confirmations disabled), ensure profile/company
    if (data.user) {
      setTimeout(() => ensureProfileAndCompany(data.user!), 0);
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo<AuthContextType>(() => ({ user, session, loading, companyId, signIn, signUp, signOut }), [user, session, loading, companyId]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
