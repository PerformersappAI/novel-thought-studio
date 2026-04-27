import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LANGUAGES, STORAGE_KEY, type LanguageCode } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  variant?: "icon" | "inline";
  className?: string;
}

const LanguageSwitcher = ({ variant = "icon", className }: LanguageSwitcherProps) => {
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const current =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) ??
    SUPPORTED_LANGUAGES[0];

  const change = async (code: LanguageCode) => {
    await i18n.changeLanguage(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {}
    if (user) {
      // Best-effort; ignore errors so language always switches in UI
      supabase
        .from("profiles")
        .update({ preferred_language: code })
        .eq("user_id", user.id)
        .then(() => {});
    }
    setOpen(false);
  };

  if (variant === "inline") {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 px-1">
          {t("nav.language")}
        </div>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => change(lang.code)}
            className={cn(
              "flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm hover:bg-secondary/60 transition-colors text-left",
              current.code === lang.code && "bg-secondary/40 text-foreground"
            )}
          >
            <span className="flex items-center gap-2">
              <span className="text-base leading-none">{lang.flag}</span>
              <span>{lang.native}</span>
            </span>
            {current.code === lang.code && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 h-9 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors focus:outline-none",
          className
        )}
        aria-label={t("nav.language")}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden md:inline text-xs font-medium uppercase tracking-wide">
          {current.code}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover border-border/40">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => change(lang.code)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="text-base leading-none">{lang.flag}</span>
              <span className="text-sm">{lang.native}</span>
            </span>
            {current.code === lang.code && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
