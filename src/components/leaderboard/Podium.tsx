import { motion } from "framer-motion";
import { Crown, Trophy, Medal, TrendingUp, BadgeCheck } from "lucide-react";
import type { LiveCreator } from "./types";
import { formatNumber } from "@/lib/format";

const ORDER = [1, 0, 2]; // visual order: 2nd, 1st, 3rd
const META = [
  {
    icon: Crown,
    label: "1st",
    color: "var(--gold)",
    height: "h-44",
    glow: "shadow-[0_0_60px_oklch(0.85_0.17_90/0.4)]",
  },
  {
    icon: Trophy,
    label: "2nd",
    color: "var(--silver)",
    height: "h-32",
    glow: "shadow-[0_0_40px_oklch(0.82_0.02_270/0.3)]",
  },
  {
    icon: Medal,
    label: "3rd",
    color: "var(--bronze)",
    height: "h-28",
    glow: "shadow-[0_0_40px_oklch(0.7_0.13_60/0.3)]",
  },
];

export function Podium({
  top3,
  onSelect,
}: {
  top3: LiveCreator[];
  onSelect: (c: LiveCreator) => void;
}) {
  if (top3.length < 3) return null;

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end">
      {ORDER.map((idx) => {
        const creator = top3[idx];
        const meta = META[idx];
        const Icon = meta.icon;
        const isFirst = idx === 0;
        return (
          <motion.button
            key={creator.id}
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            onClick={() => onSelect(creator)}
            className={`relative glass-strong rounded-2xl text-left hover:scale-[1.02] transition-transform`}
          >
            {/* Hardware-accelerated glow layer instead of expensive box-shadow animation */}
            <div 
              className={`absolute inset-0 rounded-2xl pointer-events-none ${meta.glow} ${isFirst ? "animate-pulse" : "opacity-100"}`}
            />
            
            <div className="relative p-4 sm:p-6 flex flex-col items-center gap-3">
              <div className="relative">
                <div
                  className="absolute -inset-1 rounded-full opacity-60 blur-md"
                  style={{ background: meta.color }}
                />
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  className="relative size-16 sm:size-20 rounded-full ring-2 ring-white/10"
                />
                <div
                  className="absolute -top-2 -right-2 size-8 rounded-full flex items-center justify-center text-background"
                  style={{ background: meta.color }}
                >
                  <Icon className="size-4" />
                </div>
              </div>
              <div className="text-center min-w-0 w-full">
                <div className="flex items-center justify-center gap-1">
                  <span className="font-bold text-sm sm:text-base truncate">{creator.name}</span>
                  {creator.verified && <BadgeCheck className="size-3.5 text-primary shrink-0" />}
                </div>
                <div className="text-xs text-muted-foreground truncate">{creator.handle}</div>
                <div className="mt-2 text-lg sm:text-xl font-bold text-gradient tabular-nums">
                  {formatNumber(creator.subscribers)}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  subscribers
                </div>
              </div>
              <div
                className={`w-full ${meta.height} rounded-xl flex items-center justify-center text-3xl sm:text-5xl font-black`}
                style={{
                  background: `linear-gradient(180deg, ${meta.color}, transparent 90%)`,
                  color: "oklch(0.12 0.02 270)",
                  opacity: 0.85,
                }}
              >
                {creator.rank}
              </div>
              {creator.trending === "up" && (
                <div className="flex items-center gap-1 text-xs text-[oklch(0.88_0.22_140)]">
                  <TrendingUp className="size-3" /> trending
                </div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
