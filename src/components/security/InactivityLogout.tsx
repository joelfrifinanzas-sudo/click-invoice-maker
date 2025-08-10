import { useEffect, useRef } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const IDLE_MS = 30 * 60 * 1000; // 30 minutes

export function InactivityLogout() {
  const { role } = useUserRole();
  const nav = useNavigate();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!(role === 'admin' || role === 'cajera')) return;

    const resetTimer = () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(async () => {
        try { await supabase.auth.signOut(); } catch {}
        nav('/login', { replace: true });
      }, IDLE_MS);
    };

    const events = ['mousemove','keydown','touchstart','visibilitychange'];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true } as any));
    resetTimer();
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer as any));
    };
  }, [role, nav]);

  return null;
}
