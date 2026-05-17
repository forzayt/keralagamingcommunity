import { useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BadgeCheck, ExternalLink, Eye, Film, Users, Tag, Calendar, TrendingUp, Youtube } from "lucide-react";
import type { LiveCreator } from "./types";
import { formatNumber, formatFull } from "@/lib/format";

function buildGrowth(seed: string): { day: string; value: number }[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const rng = () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return (h & 0xffff) / 0xffff;
  };
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  let v = 60 + rng() * 20;
  return days.map((d) => {
    v += (rng() - 0.4) * 25;
    v = Math.max(20, Math.min(100, v));
    return { day: d, value: v };
  });
}

export function CreatorModal({
  creator,
  onOpenChange,
}: {
  creator: LiveCreator | null;
  onOpenChange: (open: boolean) => void;
}) {
  const growth = useMemo(() => (creator ? buildGrowth(creator.id) : []), [creator]);
  const max = Math.max(...growth.map((g) => g.value), 1);

  return (
    <Dialog open={!!creator} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border/60 max-w-2xl p-0 overflow-hidden">
        {creator && (
          <div className="relative">
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 20% 0%, oklch(0.72 0.22 160 / 0.5), transparent 60%), radial-gradient(circle at 80% 100%, oklch(0.68 0.25 320 / 0.4), transparent 55%)",
              }}
            />
            <div className="relative p-6 sm:p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary to-accent blur-md opacity-70" />
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className="relative size-20 rounded-full ring-2 ring-white/10"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-bold">{creator.name}</h2>
                    {creator.verified && <BadgeCheck className="size-5 text-primary" />}
                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
                      Rank #{creator.rank}
                    </span>
                  </div>
                  <a
                    href={creator.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                  >
                    {creator.handle} <ExternalLink className="size-3" />
                  </a>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {creator.niche.map((n) => (
                      <span
                        key={n}
                        className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border border-border/60 bg-secondary/40"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{creator.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={Users} label="Subscribers" value={formatFull(creator.subscribers)} hint={`${creator.delta >= 0 ? "+" : ""}${creator.delta} live`} />
                <StatCard icon={Eye} label="Total Views" value={formatNumber(creator.views)} />
                <StatCard icon={Film} label="Videos" value={formatFull(creator.videos)} />
                <StatCard icon={Tag} label="Niche" value={creator.niche[0] ?? "Gaming"} />
              </div>

              <div className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <TrendingUp className="size-4 text-primary" /> 7-day growth simulation
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3" /> last week
                  </span>
                </div>
                <div className="flex items-end gap-2 h-28">
                  {growth.map((g, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md transition-all"
                        style={{
                          height: `${(g.value / max) * 100}%`,
                          background: "linear-gradient(180deg, oklch(0.72 0.22 160), oklch(0.68 0.25 320))",
                          boxShadow: "0 0 12px oklch(0.72 0.22 160 / 0.4)",
                        }}
                      />
                      <span className="text-[10px] text-muted-foreground">{g.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <SocialLink icon={Youtube} href={creator.url} label="YouTube Channel" />
                <a
                  href={creator.url}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm hover:opacity-90 transition"
                >
                  Visit Channel <ExternalLink className="size-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ icon: Icon, label, value, hint }: { icon: React.ElementType; label: string; value: string; hint?: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3" /> {label}
      </div>
      <div className="mt-1 font-bold text-base tabular-nums truncate">{value}</div>
      {hint && <div className="text-[10px] text-primary tabular-nums">{hint}</div>}
    </div>
  );
}

function SocialLink({ icon: Icon, href, label }: { icon: React.ElementType; href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg glass text-xs hover:border-primary/40 transition"
    >
      <Icon className="size-3.5" /> {label}
    </a>
  );
}