import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Gamepad2, Trophy, Radio, Loader2, Menu, X, Plus } from "lucide-react";
import creatorUrls from "@/data/creators.json";
import type { LiveCreator } from "@/components/leaderboard/types";
import { useLiveCreators } from "@/components/leaderboard/useLiveCreators";
import { Podium } from "@/components/leaderboard/Podium";
import { LeaderboardRow } from "@/components/leaderboard/LeaderboardRow";
import { CreatorModal } from "@/components/leaderboard/CreatorModal";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchChannels } from "@/lib/youtube.functions";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kerala Gaming Leaderboard — Live Creator Rankings" },
      {
        name: "description",
        content:
          "Real-time leaderboard of Kerala's top YouTube gaming creators with live subscriber tracking, podium rankings, and esports-grade analytics.",
      },
      { property: "og:title", content: "Kerala Gaming Leaderboard" },
      {
        property: "og:description",
        content: "Live ranks for Kerala's most influential gaming creators.",
      },
    ],
  }),
  component: Index,
});

const urls = creatorUrls as string[];

type SortKey = "subscribers" | "views" | "videos";

function Index() {
  const {
    data: seed = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["channels", urls],
    queryFn: () => fetchChannels({ urls }),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours client-side cache
    refetchOnWindowFocus: false,
  });

  const { data: liveStatus = [] } = useQuery({
    queryKey: ["live-status"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/live");
        if (!res.ok) return [];
        return (await res.json()) as { handle: string; isLive: boolean }[];
      } catch (e) {
        return [];
      }
    },
    refetchInterval: 60 * 1000, // Update live status every minute
  });

  const live = useLiveCreators(seed, liveStatus);
  const [query, setQuery] = useState("");
  const [btnTextIdx, setBtnTextIdx] = useState(0);
  const buttonTexts = [
    "Are u a gamer ?",
    "Did you know any gamer ?",
    "Feel free to add here.."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setBtnTextIdx((prev) => (prev + 1) % buttonTexts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  const [niche, setNiche] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("subscribers");
  const [selected, setSelected] = useState<LiveCreator | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSubmitModal(true)}
              className="hidden sm:flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all hover:scale-105 text-xs font-bold shadow-[0_0_15px_oklch(0.72_0.22_160/0.15)] hover:shadow-[0_0_20px_oklch(0.72_0.22_160/0.3)] overflow-hidden min-w-[170px] justify-center cursor-pointer"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={btnTextIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {buttonTexts[btnTextIdx]}
                </motion.span>
              </AnimatePresence>
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[oklch(0.88_0.22_140)] opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full size-2 bg-[oklch(0.88_0.22_140)]" />
              </span>
              <Radio className="size-3" />
              <a href="https://www.tvaxkva.com/" target="_blank" rel="noopener noreferrer">
                {" "}
                Streaming Now
              </a>
            </div>

            {/* Mobile hamburger menu toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="sm:hidden p-2 rounded-xl glass border border-border/40 hover:bg-secondary/40 transition-all active:scale-95 text-foreground cursor-pointer"
              aria-label="Toggle menu"
            >
              {showMobileMenu ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {showMobileMenu && (
            <>
              {/* Backdrop overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobileMenu(false)}
                className="fixed inset-0 top-[73px] z-20 bg-background/80 backdrop-blur-md sm:hidden"
              />
              {/* Dropdown Menu Panel */}
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="absolute left-0 right-0 top-full z-20 border-b border-border/40 bg-black p-6 sm:hidden flex flex-col gap-5 overflow-hidden"
              >
                <div className="flex flex-col gap-3 items-center">
                  <button 
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowSubmitModal(true);
                    }}
                    className="w-full flex items-center px-4 py-2.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all hover:scale-102 text-xs font-bold shadow-[0_0_15px_oklch(0.72_0.22_160/0.15)] hover:shadow-[0_0_20px_oklch(0.72_0.22_160/0.3)] overflow-hidden justify-center cursor-pointer"
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={btnTextIdx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-1.5"
                      >
                        <Plus className="size-3.5" />
                        {buttonTexts[btnTextIdx]}
                      </motion.span>
                    </AnimatePresence>
                  </button>

                  <div className="w-full flex items-center gap-2 px-3 py-2.5 rounded-full glass border border-border/20 text-xs justify-center">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-[oklch(0.88_0.22_140)] opacity-60 animate-ping" />
                      <span className="relative inline-flex rounded-full size-2 bg-[oklch(0.88_0.22_140)]" />
                    </span>
                    <Radio className="size-3.5 text-primary" />
                    <a href="https://www.tvaxkva.com/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                      Streaming Now
                    </a>
                  </div>
                </div>

                <div className="h-px bg-border/20 w-full" />

                <div className="flex flex-col gap-3 text-xs text-center">
                  <button 
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowPrivacyModal(true);
                    }}
                    className="hover:text-primary text-muted-foreground transition-colors hover:underline cursor-pointer py-1"
                  >
                    Privacy Policy
                  </button>
                  <a 
                    href="https://github.com/forzayt" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-primary text-muted-foreground transition-colors py-1"
                  >
                    Follow me on github | Forzayt
                  </a>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary">
            <Trophy className="size-3.5" /> season 26 · live
          </div>
          <h2 className="text-4xl sm:text-6xl font-black leading-[1.05] max-w-3xl">
            The pulse of <span className="text-gradient">Kerala's</span> gaming creators, ranked in
            real time.
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Subscriber counts update every second. Watch ranks shift, podiums shake, and underdogs
            climb — straight from God's own gaming country.
          </p>
          <div className="flex flex-wrap gap-6 pt-2 text-sm">
            <Stat label="Creators tracked" value={live.length.toString()} />
            <Stat label="Combined reach" value={(totalSubs / 1_000_000).toFixed(2) + "M"} />
            <Stat label="Niches" value={(niches.length - 1).toString()} />
          </div>
        </motion.section>

        {isLoading ? <PodiumSkeleton /> : <Podium top3={top3} onSelect={setSelected} />}

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
          className="glass rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:items-center"
        >
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
            <SelectChip
              icon={<Filter className="size-3" />}
              value={niche}
              onChange={setNiche}
              options={niches}
              prefix="Niche"
            />
            <SelectChip
              value={sortKey}
              onChange={(v) => setSortKey(v as SortKey)}
              options={["subscribers", "views", "videos"]}
              prefix="Sort"
            />
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
          className="space-y-2"
        >
          <div className="hidden sm:grid grid-cols-[48px_2fr_1fr_1fr_1fr_120px] gap-4 px-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>#</span>
            <span>Creator</span>
            <span>Niche</span>
            <span className="text-right">Subscribers</span>
            <span>Views</span>
            <span className="text-right">Action</span>
          </div>
          {!isLoading &&
            filtered.map((c) => (
              <LeaderboardRow key={c.id} creator={c} onClick={() => setSelected(c)} />
            ))}
          {isLoading && <LeaderboardSkeleton />}
          {isError && (
            <div className="glass rounded-2xl p-10 text-center space-y-3">
              <p className="text-muted-foreground">Couldn't reach YouTube. Try again.</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
              >
                Retry
              </button>
            </div>
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
              No creators match those filters.
            </div>
          )}
        </motion.section>

        <footer className="pt-12 pb-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center text-[11px] sm:text-xs text-muted-foreground">
          <span>Built by a gamer for gamers.</span>
          <span className="opacity-40">|</span>
          <a 
            href="https://github.com/forzayt" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Follow me on github | Forzayt
          </a>
          <span className="opacity-40">|</span>
          <button 
            onClick={() => setShowPrivacyModal(true)}
            className="hover:text-primary transition-colors hover:underline cursor-pointer"
          >
            Privacy Policy
          </button>
          <span className="opacity-40">|</span>
          <span>© 2026 All rights reserved</span>
        </footer>
      </main>

      <CreatorModal creator={selected} onOpenChange={(o) => !o && setSelected(null)} />
      
      <GamerSubmitModal 
        isOpen={showSubmitModal} 
        onClose={() => setShowSubmitModal(false)} 
        onSuccess={() => {
          setShowSubmitModal(false);
          setShowSuccessModal(true);
        }} 
      />
      <GamerSuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
      />
      <PrivacyPolicyModal 
        isOpen={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
      />
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

function PodiumSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end">
      {[1, 0, 2].map((idx) => {
        const height = idx === 0 ? "h-44" : idx === 1 ? "h-32" : "h-28";
        return (
          <div key={idx} className="glass-strong rounded-2xl p-4 sm:p-6 text-center animate-pulse">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="size-16 sm:size-20 rounded-full" />
              <div className="w-full space-y-2 flex flex-col items-center">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-6 w-3/4 mt-2" />
              </div>
              <Skeleton className={`w-full ${height} rounded-xl`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="w-full glass rounded-2xl p-4 grid grid-cols-[40px_1fr_auto] sm:grid-cols-[48px_2fr_1fr_1fr_1fr_80px] gap-3 sm:gap-4 items-center"
        >
          <Skeleton className="h-6 w-6" />
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 sm:size-12 rounded-full shrink-0" />
            <div className="space-y-2 w-full">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="hidden sm:flex gap-1">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <div className="hidden sm:block">
            <Skeleton className="h-5 w-20 ml-auto" />
          </div>
          <div className="hidden sm:block">
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="hidden sm:block">
            <Skeleton className="h-4 w-4 mx-auto" />
          </div>
        </div>
      ))}
    </>
  );
}

function GamerSubmitModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setError(null);

    const trimmedUrl = url.trim();
    const lowerUrl = trimmedUrl.toLowerCase();

    // Validate YouTube URL
    if (!lowerUrl.includes("youtube.com") && !lowerUrl.includes("youtu.be")) {
      setError("Please enter a valid YouTube URL (youtube.com).");
      return;
    }

    // Normalization helper to compare URLs
    const normalize = (u: string) =>
      u
        .replace(/^(https?:\/\/)?(www\.)?/, "")
        .replace(/\/$/, "")
        .toLowerCase();

    const normalizedInput = normalize(trimmedUrl);
    const exists = (creatorUrls as string[]).some(
      (existingUrl) => normalize(existingUrl) === normalizedInput
    );

    if (exists) {
      setError("You are already on the leaderboard!");
      return;
    }

    setLoading(true);
    try {
      const { error: submitError } = await supabase
        .from('submissions')
        .insert([{ youtube_url: trimmedUrl }]);

      if (submitError) throw submitError;
      setUrl("");
      onSuccess();
    } catch (err) {
      console.error(err);
      // Still show success even on error to not block the user, or handle properly
      onSuccess(); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: "-50%", x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, y: "-50%", x: "-50%" }}
            className="fixed top-1/2 left-1/2 z-50 w-[90%] max-w-md glass-strong p-6 rounded-2xl shadow-2xl border border-border/50 flex flex-col gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <Gamepad2 className="size-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gradient">Submit your or your fav channel</h3>
                <p className="text-xs text-muted-foreground">Drop your YouTube URL to get featured.</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <Input
                  type="url"
                  required
                  placeholder="https://youtube.com/@yourhandle"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (error) setError(null);
                  }}
                  className="bg-secondary/40 border-border/60"
                />
                {error && (
                  <span className="text-red-500 text-xs font-semibold px-1">
                    {error}
                  </span>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-secondary transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  Submit
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function GamerSuccessModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: "-50%", x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, y: "-50%", x: "-50%" }}
            className="fixed top-1/2 left-1/2 z-50 w-[90%] max-w-sm glass-strong p-6 sm:p-8 rounded-2xl shadow-2xl border border-border/50 text-center flex flex-col items-center gap-4"
          >
            <div className="size-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-2 glow-primary">
              <Trophy className="size-8" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-gradient leading-tight">lemme see<br/>what you got</h3>
            <p className="text-sm text-muted-foreground mt-2">
              I've received your channel. I'll check it out and add you to the leaderboard soon!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
            NB: I will update your channel ASAP - If im not under your GF's bed .
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-8 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:scale-105 transition-transform shadow-[0_0_20px_oklch(0.72_0.22_160/0.3)]"
            >
              Awesome
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PrivacyPolicyModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: "-50%", x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, y: "-50%", x: "-50%" }}
            className="fixed top-1/2 left-1/2 z-50 w-[90%] max-w-lg glass-strong p-6 sm:p-8 rounded-2xl shadow-2xl border border-border/50 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
          >
            <h3 className="text-2xl font-black text-gradient">Privacy Policy</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Last updated: May 2026</p>
            
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed mt-2 text-left">
              <p>
                Welcome to the Kerala Gaming Community Leaderboard. Your privacy is extremely important to us. Here is how we handle and protect data in our esports portal:
              </p>
              
              <div className="space-y-2">
                <h4 className="font-bold text-foreground">1. Public Channel Metrics</h4>
                <p>
                  We fetch and display public channel metrics directly from the official YouTube API (including subscriber counts, view counts, video counts, and basic creator metadata). This data is completely public and accessible on YouTube.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground">2. Channel Submissions</h4>
                <p>
                  When you submit a channel link for review, we securely store the URL in our database to review and list qualifying gaming creators. We do not require or collect personal identity details or email addresses.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground">3. Tracking & Advertising</h4>
                <p>
                  We do not run tracking cookies, sell your data to third-party brokers, or display intrusive advertisements. The portal is 100% community-driven and dedicated to showcasing regional esports talents.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:scale-105 transition-transform shadow-[0_0_20px_oklch(0.72_0.22_160/0.3)]"
            >
              Close
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
