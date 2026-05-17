import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Filter, Gamepad2, Trophy, Radio, Loader2 } from "lucide-react";
import creatorUrls from "@/data/creators.json";
import type { LiveCreator } from "@/components/leaderboard/types";
import { useLiveCreators } from "@/components/leaderboard/useLiveCreators";
import { Podium } from "@/components/leaderboard/Podium";
import { LeaderboardRow } from "@/components/leaderboard/LeaderboardRow";
import { CreatorModal } from "@/components/leaderboard/CreatorModal";
import { Input } from "@/components/ui/input";
import { fetchChannels } from "@/lib/youtube.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kerala Gaming Leaderboard — Live Creator Rankings" },
      { name: "description", content: "Real-time leaderboard of Kerala's top YouTube gaming creators with live subscriber tracking, podium rankings, and esports-grade analytics." },
      { property: "og:title", content: "Kerala Gaming Leaderboard" },
      { property: "og:description", content: "Live ranks for Kerala's most influential gaming creators." },
    ],
  }),
  component: Index,
});

const urls = creatorUrls as string[];

type SortKey = "subscribers" | "views" | "videos";

function Index() {
  const callFetch = useServerFn(fetchChannels);
  const { data: seed = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["channels", urls],
    queryFn: () => callFetch({ data: { urls } }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const live = useLiveCreators(seed);
  const [query, setQuery] = useState("");
  const [niche, setNiche] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("subscribers");
  const [selected, setSelected] = useState<LiveCreator | null>(null);

  const niches = useMemo(
    () => ["all", ...Array.from(new Set(seed.flatMap((c) => c.niche))).sort()],
    [seed],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = live.filter((c) => {
      if (niche !== "all" && !c.niche.includes(niche)) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        c.niche.some((n) => n.toLowerCase().includes(q))
      );
    });
    return [...list].sort((a, b) => b[sortKey] - a[sortKey]);
  }, [live, query, niche, sortKey]);

  const top3 = live.slice(0, 3);
  const totalSubs = live.reduce((sum, c) => sum + c.subscribers, 0);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/40 backdrop-blur-xl bg-background/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
              <Gamepad2 className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg leading-none">
                KERALA <span className="text-gradient">Gaming Community</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                gaming creator leaderboard
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[oklch(0.88_0.22_140)] opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full size-2 bg-[oklch(0.88_0.22_140)]" />
            </span>
           <Radio className="size-3" /><a href="https://www.tvaxkva.com/" target="_blank" rel="noopener noreferrer"> Streaming Now</a> 
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary">
            <Trophy className="size-3.5" /> season 26 · live
          </div>
          <h2 className="text-4xl sm:text-6xl font-black leading-[1.05] max-w-3xl">
            The pulse of <span className="text-gradient">Kerala's</span> gaming creators, ranked in real time.
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Subscriber counts update every second. Watch ranks shift, podiums shake, and underdogs climb — straight from God's own gaming country.
          </p>
          <div className="flex flex-wrap gap-6 pt-2 text-sm">
            <Stat label="Creators tracked" value={live.length.toString()} />
            <Stat label="Combined reach" value={(totalSubs / 1_000_000).toFixed(2) + "M"} />
            <Stat label="Niches" value={(niches.length - 1).toString()} />
          </div>
        </section>

        <Podium top3={top3} onSelect={setSelected} />

        <section className="glass rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search creator, handle, or niche…"
              className="pl-9 bg-secondary/40 border-border/60"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <SelectChip icon={<Filter className="size-3" />} value={niche} onChange={setNiche} options={niches} prefix="Niche" />
            <SelectChip
              value={sortKey}
              onChange={(v) => setSortKey(v as SortKey)}
              options={["subscribers", "views", "videos"]}
              prefix="Sort"
            />
          </div>
        </section>

        <section className="space-y-2">
          <div className="hidden sm:grid grid-cols-[48px_2fr_1fr_1fr_1fr_80px] gap-4 px-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>#</span>
            <span>Creator</span>
            <span>Niche</span>
            <span className="text-right">Subscribers</span>
            <span>Views</span>
            <span className="text-center">Trend</span>
          </div>
          <AnimatePresence>
            {filtered.map((c) => (
              <LeaderboardRow key={c.id} creator={c} onClick={() => setSelected(c)} />
            ))}
          </AnimatePresence>
          {isLoading && (
            <div className="glass rounded-2xl p-10 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" /> Fetching live data from YouTube…
            </div>
          )}
          {isError && (
            <div className="glass rounded-2xl p-10 text-center space-y-3">
              <p className="text-muted-foreground">Couldn't reach YouTube. Try again.</p>
              <button onClick={() => refetch()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                Retry
              </button>
            </div>
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
              No creators match those filters.
            </div>
          )}
        </section>

        <footer className="pt-12 pb-8 text-center text-xs text-muted-foreground">
          Built for the Kerala gaming community · Live data simulated for demo purposes
        </footer>
      </main>

      <CreatorModal creator={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-gradient tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
    </div>
  );
}

function SelectChip({
  value,
  onChange,
  options,
  prefix,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  prefix: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/40 border border-border/60 text-xs cursor-pointer hover:border-primary/40 transition">
      {icon}
      <span className="text-muted-foreground uppercase tracking-wider text-[10px]">{prefix}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent outline-none capitalize cursor-pointer"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-popover capitalize">
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
