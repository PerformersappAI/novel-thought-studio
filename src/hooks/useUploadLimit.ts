import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface UploadLimits {
  maxAssets: number;
  currentCount: number;
  dailyCount: number;
  canUpload: boolean;
  tierName: string;
  loading: boolean;
}

export const useUploadLimit = (): UploadLimits => {
  const { user } = useAuth();
  const [limits, setLimits] = useState<UploadLimits>({
    maxAssets: 3, currentCount: 0, dailyCount: 0, canUpload: true, tierName: "Free", loading: true,
  });

  useEffect(() => {
    if (!user) return;

    const fetchLimits = async () => {
      // Get user's subscription
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("plan_id, status, subscription_plans(name, price_cents)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      let maxAssets = 3;
      let tierName = "Free";

      if (sub?.subscription_plans) {
        const plan = sub.subscription_plans as any;
        const priceDollars = plan.price_cents / 100;
        if (priceDollars >= 49) {
          maxAssets = Infinity;
          tierName = plan.name || "Studio";
        } else if (priceDollars >= 19) {
          maxAssets = 25;
          tierName = plan.name || "Pro";
        }
      }

      // Get total asset count
      const { count: totalCount } = await supabase
        .from("registry_assets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Get daily upload count (rate limit: 10/day)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: dailyCount } = await supabase
        .from("registry_assets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", dayAgo);

      const currentCount = totalCount ?? 0;
      const daily = dailyCount ?? 0;
      const canUpload = currentCount < maxAssets && daily < 10;

      setLimits({ maxAssets, currentCount, dailyCount: daily, canUpload, tierName, loading: false });
    };

    fetchLimits();
  }, [user]);

  return limits;
};
