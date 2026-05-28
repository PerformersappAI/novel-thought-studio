import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve a `profiles.headshot_url` value (either a legacy public URL or a
 * storage path inside the private `headshots` bucket) into a temporary
 * signed URL the browser can render.
 *
 * Legacy rows store a full https:// URL — returned as-is.
 * New rows store the storage path (`{user_id}/...`) — signed for 1h.
 */
export async function resolveHeadshotUrl(
  value: string | null | undefined,
  expiresInSeconds: number = 3600,
): Promise<string | null> {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const { data, error } = await supabase.storage
    .from("headshots")
    .createSignedUrl(value, expiresInSeconds);
  if (error) return null;
  return data?.signedUrl ?? null;
}
