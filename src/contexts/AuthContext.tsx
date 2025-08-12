import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  companyId: string | null;
  memberRole: 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'CAJERA' | 'CLIENTE' | null;
  hasRole: (...roles: Array<'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'CAJERA' | 'CLIENTE'>) => boolean;
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
  const [memberRole, setMemberRole] = useState<AuthContextType["memberRole"]>(null);

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
        setMemberRole(null);
        try { localStorage.removeItem('app:role'); } catch {}
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
    // 1) Fetch or create profile/company
    const { data: profile } = await supabase
      .from("users_profiles")
      .select("id, company_id")
      .eq("id", u.id)
      .maybeSingle();

    let cid = profile?.company_id as string | null | undefined;

    if (!cid) {
      const defaultName = (u.email?.split("@")[0] || "Mi Empresa").slice(0, 80);
      const { data: company } = await supabase
        .from("companies")
        .insert({ owner_user_id: u.id, name: defaultName })
        .select("id")
        .maybeSingle();
      cid = company?.id ?? null;

      if (cid) {
        try {
          const { data: up } = await supabase
            .from("users_profiles")
            .upsert({ id: u.id, company_id: cid })
            .select("company_id")
            .maybeSingle();
          cid = up?.company_id ?? cid;
        } catch {}
      }
    }

    if (cid) setCompanyId(cid);

    // 2) Fetch membership role for active member
    if (cid) {
      try {
        const { data: mem } = await supabase
          .from("company_members")
          .select("role,status")
          .eq("company_id", cid)
          .eq("user_id", u.id)
          .maybeSingle();
        const r = (mem as any)?.role ?? null;
        setMemberRole(r);
        try { if (r) localStorage.setItem('app:role', r); } catch {}
      } catch {}
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

  const hasRole: AuthContextType["hasRole"] = (...roles) => {
    const current = (memberRole ?? (localStorage.getItem('app:role') as any)) as AuthContextType["memberRole"];
    return !!current && roles.includes(current);
  };

  const value = useMemo<AuthContextType>(() => ({ user, session, loading, companyId, memberRole, hasRole, signIn, signUp, signOut }), [user, session, loading, companyId, memberRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
