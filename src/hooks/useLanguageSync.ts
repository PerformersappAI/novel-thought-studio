import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { STORAGE_KEY, SUPPORTED_LANGUAGES } from "@/i18n";

/**
 * Syncs the logged-in user's preferred_language column with i18next.
 * Runs once after login to load their saved choice.
 */
export const useLanguageSync = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const lang = data?.preferred_language;
      if (
        lang &&
        SUPPORTED_LANGUAGES.some((l) => l.code === lang) &&
        i18n.resolvedLanguage !== lang
      ) {
        await i18n.changeLanguage(lang);
        try {
          localStorage.setItem(STORAGE_KEY, lang);
        } catch {}
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, i18n]);
};
