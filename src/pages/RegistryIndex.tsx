import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, User, Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { resolveHeadshotUrl } from "@/lib/headshotUrl";

const BG = "#12131a";
const GOLD = "#e6a800";

interface Row {
  id: string;
  slug: string;
  stage_name: string;
  headshot_url: string | null;
  profession: string | null;
  union_status: string | null;
  verified_date: string | null;
}

const RegistryIndex = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("registry_performers")
        .select("id, slug, stage_name, headshot_url, profession, union_status, verified_date")
        .order("stage_name", { ascending: true });
      const resolved = await Promise.all(
        ((data ?? []) as Row[]).map(async (r) => ({
          ...r,
          headshot_url: await resolveHeadshotUrl(r.headshot_url),
        })),
      );
      setRows(resolved);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter(
    (r) =>
      !q ||
      r.stage_name?.toLowerCase().includes(q.toLowerCase()) ||
      r.profession?.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="min-h-screen text-white" style={{ background: BG }}>
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <header className="rounded-2xl p-6 mb-6" style={{ background: GOLD, color: "#1a1208" }}>
          <h1 className="font-display text-3xl font-bold">ClaimMyFace Registry</h1>
          <p className="text-sm mt-1 opacity-80">
            Verified performers — browseable by casting directors, producers, and agents.
          </p>
        </header>

        <div className="relative mb-6">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <Input
            placeholder="Search by name or profession…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 bg-white/[0.04] border-white/10 text-white placeholder:text-white/40"
          />
        </div>

        {loading ? (
          <p className="text-white/60 text-center py-12 animate-pulse">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.02]">
            <p className="text-white/60 mb-2">No performers yet.</p>
            <p className="text-white/40 text-sm">Verified performers will appear here.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <Link
                key={r.id}
                to={`/registry/${r.slug}`}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:border-white/20 transition flex gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {r.headshot_url ? (
                    <img src={r.headshot_url} alt={r.stage_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-white/40" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-semibold truncate flex items-center gap-1.5">
                    {r.stage_name}
                    {r.verified_date && <ShieldCheck className="w-3.5 h-3.5" style={{ color: GOLD }} />}
                  </h3>
                  {r.profession && <p className="text-xs text-white/60 truncate">{r.profession}</p>}
                  {r.union_status && (
                    <span
                      className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium border"
                      style={{ borderColor: GOLD, color: GOLD }}
                    >
                      {r.union_status}
                    </span>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/80 transition self-center" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistryIndex;
