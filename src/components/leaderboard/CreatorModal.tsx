import { useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  BadgeCheck,
  ExternalLink,
  Eye,
  Film,
  Users,
  Tag,
  Youtube,
  Gamepad2,
  Radio,
} from "lucide-react";
import type { LiveCreator } from "./types";
import { formatNumber, formatFull } from "@/lib/format";
import { useLiveStatus } from "@/hooks/useLiveStatus";

export function CreatorModal({
  creator,
  onOpenChange,
}: {
  creator: LiveCreator | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { isLive } = useLiveStatus(creator?.url ?? "");

  const avgViews = useMemo(() => {
    if (!creator || creator.videos <= 0) return 0;
    return Math.round(creator.views / creator.videos);
  }, [creator]);

  const tier = useMemo(() => {
    if (!creator) return "Rising Star";
    if (creator.subscribers >= 1_000_000) return "Legendary";
    if (creator.subscribers >= 500_000) return "Grandmaster";
    if (creator.subscribers >= 100_000) return "Master";
    return "Rising Star";
  }, [creator]);

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
                  <div className={`absolute -inset-1 rounded-full blur-md opacity-70 transition-all ${
                    isLive ? "bg-red-500 animate-pulse" : "bg-gradient-to-br from-primary to-accent"
                  }`} />
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className={`relative size-20 rounded-full transition-all ${
                      isLive 
                        ? "ring-4 ring-red-500 ring-offset-4 ring-offset-background" 
                        : "ring-2 ring-white/10"
                    }`}
                  />
                  {isLive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-500 text-[9px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wider ring-2 ring-background whitespace-nowrap z-10">
                      Watch Live
                    </span>
                  )}
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
                <StatCard
                  icon={Users}
                  label="Subscribers"
                  value={formatFull(creator.subscribers)}
                  hint={`${creator.delta >= 0 ? "+" : ""}${creator.delta} live`}
                />
                <StatCard icon={Eye} label="Total Views" value={formatNumber(creator.views)} />
                <StatCard icon={Film} label="Videos" value={formatFull(creator.videos)} />
                <StatCard icon={Tag} label="Niche" value={creator.niche[0] ?? "Gaming"} />
              </div>


              {/* Advanced Insights Section */}
              <div className="glass rounded-xl p-4 space-y-3">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <Gamepad2 className="size-4 text-primary" /> Channel Insights & Analytics
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-secondary/20 rounded-lg p-3 border border-border/40">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg. Views / Video</div>
                    <div className="mt-1 font-bold text-xs sm:text-sm tabular-nums text-gradient truncate">
                      {avgViews > 0 ? formatNumber(avgViews) : "N/A"}
                    </div>
                  </div>
                  <div className="bg-secondary/20 rounded-lg p-3 border border-border/40">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Creator Tier</div>
                    <div className="mt-1 font-bold text-xs sm:text-sm text-gradient truncate">
                      {tier}
                    </div>
                  </div>
                  <div className="bg-secondary/20 rounded-lg p-3 border border-border/40">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Views / Subscriber</div>
                    <div className="mt-1 font-bold text-xs sm:text-sm tabular-nums text-gradient truncate">
                      {(creator.views / creator.subscribers).toFixed(1)}x
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SocialLink icon={Youtube} href={creator.url} label="YouTube Channel" />
                
                <div className="ml-auto flex items-center gap-2">
                  {isLive && (
                    <a
                      href={`${creator.url.replace(/\/$/, "")}/live`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    >
                      <Radio className="size-3.5" /> Watch Live
                    </a>
                  )}
                  <a
                    href={creator.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm hover:opacity-90 transition"
                  >
                    Visit Channel <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
}) {
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

function SocialLink({
  icon: Icon,
  href,
  label,
}: {
  icon: React.ElementType;
  href: string;
  label: string;
}) {
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
