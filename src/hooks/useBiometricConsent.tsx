import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useBiometricConsent() {
  const { user } = useAuth();
  const [consented, setConsented] = useState<boolean | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("consent_given")
      .eq("user_id", user.id)
      .maybeSingle();
    setConsented(!!data?.consent_given);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  /** Returns true if already consented; otherwise opens modal and returns false. */
  const requireConsent = useCallback((): boolean => {
    if (consented) return true;
    setModalOpen(true);
    return false;
  }, [consented]);

  const onConsented = useCallback(() => {
    setConsented(true);
    setModalOpen(false);
  }, []);

  return { consented, modalOpen, setModalOpen, requireConsent, onConsented, refresh };
}
