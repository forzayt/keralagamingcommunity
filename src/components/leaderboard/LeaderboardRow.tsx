import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Minus, BadgeCheck, Eye, Radio } from "lucide-react";
import type { LiveCreator } from "./types";
import { formatNumber } from "@/lib/format";
import { useLiveStatus } from "@/hooks/useLiveStatus";

export function LeaderboardRow({
  creator,
  onClick,
}: {
  creator: LiveCreator;
  onClick: () => void;
}) {
  const { isLive } = useLiveStatus(creator.url);
  const rankDiff = creator.previousRank - creator.rank;
  const RankIcon = rankDiff > 0 ? ArrowUp : rankDiff < 0 ? ArrowDown : Minus;
  const rankColor =
    rankDiff > 0
      ? "text-[oklch(0.88_0.22_140)]"
      : rankDiff < 0
        ? "text-[oklch(0.65_0.25_25)]"
        : "text-muted-foreground";

  const deltaKey = `${creator.id}-${creator.subscribers}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      <button
        onClick={onClick}
        className="group w-full glass-list-item rounded-2xl p-4 grid grid-cols-[40px_1fr_auto] sm:grid-cols-[48px_2fr_1fr_1fr_1fr_120px] gap-3 sm:gap-4 items-center text-left hover:border-primary/40 hover:bg-card/80 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-1">
          <span className="font-black text-lg sm:text-xl text-gradient tabular-nums w-7 text-center">
            {creator.rank}
          </span>
          <RankIcon className={`size-3.5 ${rankColor}`} />
        </div>

        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src={creator.avatar}
              alt={`${creator.name} avatar`}
              className={`size-10 sm:size-12 rounded-full shrink-0 transition-all ${
                isLive 
                  ? "ring-2 ring-red-500 ring-offset-2 ring-offset-background animate-pulse" 
                  : "ring-1 ring-border"
              }`}
            />
            {isLive && (
               <span className="absolute -bottom-1 -right-1 bg-red-500 text-[7px] font-bold px-1 py-0.5 rounded-sm text-white uppercase tracking-tighter ring-1 ring-background whitespace-nowrap">
                 Watch Live
               </span>
             )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold truncate">{creator.name}</span>
              {creator.verified && <BadgeCheck className="size-3.5 text-primary shrink-0" />}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{creator.handle}</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex flex-wrap gap-1">
          {creator.niche.map((n) => (
            <span
              key={n}
              className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border border-border/60 bg-secondary/40 text-muted-foreground"
            >
              {n}
            </span>
          ))}
        </div>

        <div className="hidden sm:block text-right">
          <motion.div
            key={deltaKey}
            initial={{ y: creator.delta >= 0 ? 6 : -6, opacity: 0.7 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="font-bold tabular-nums"
          >
            {formatNumber(creator.subscribers)}
          </motion.div>
          {creator.delta !== 0 && (
            <div
              className={`text-[10px] tabular-nums ${
                creator.delta > 0
                  ? "text-[oklch(0.88_0.22_140)]"
                  : creator.delta < 0
                    ? "text-[oklch(0.65_0.25_25)]"
                    : "text-muted-foreground"
              }`}
            >
              {creator.delta > 0 ? "+" : ""}
              {creator.delta} live
            </div>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
          <Eye className="size-3.5" />
          {formatNumber(creator.views)}
        </div>

        <div className="flex items-center justify-end gap-2 text-right">
          {isLive && (
            <a
              href={`${creator.url}/live`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5 animate-pulse"
            >
              <Radio className="size-3" /> Live
            </a>
          )}
          <span className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-black shadow-[0_0_15px_oklch(0.72_0.22_160/0.05)] group-hover:bg-primary/20 group-hover:border-primary/30 transition-all group-hover:scale-[1.03]">
            View
          </span>
        </div>

        <div className="sm:hidden col-span-3 flex items-center justify-between text-xs">
          <span className="font-bold tabular-nums">{formatNumber(creator.subscribers)} subs</span>
          <span className="text-muted-foreground">{formatNumber(creator.views)} views</span>
        </div>
      </button>
    </motion.div>
  );
}
