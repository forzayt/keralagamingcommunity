import { motion } from "framer-motion";
import { Crown, Trophy, Medal, BadgeCheck } from "lucide-react";
import type { LiveCreator } from "./types";
import { formatNumber } from "@/lib/format";
import { useLiveStatus } from "@/hooks/useLiveStatus";

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

function PodiumItem({ 
  creator, 
  meta, 
  idx, 
  onSelect 
}: { 
  creator: LiveCreator; 
  meta: typeof META[0]; 
  idx: number; 
  onSelect: (c: LiveCreator) => void;
}) {
  const { isLive } = useLiveStatus(creator.url);
  const Icon = meta.icon;
  const isFirst = idx === 0;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: idx * 0.1 }}
      onClick={() => onSelect(creator)}
      className={`relative glass-strong rounded-2xl text-left hover:scale-[1.02] transition-transform`}
    >
      <div 
        className={`absolute inset-0 rounded-2xl pointer-events-none ${meta.glow} ${isFirst ? "animate-pulse" : "opacity-100"}`}
      />
      
      <div className="relative p-4 sm:p-6 flex flex-col items-center gap-3">
        <div className="relative">
          <div
            className="absolute -inset-1 rounded-full opacity-60 blur-md"
            style={{ background: meta.color }}
          />
          <div className="relative">
            <img
              src={creator.avatar}
              alt={`${creator.name} podium avatar`}
              className={`relative size-16 sm:size-20 rounded-full transition-all ${
                isLive 
                  ? "ring-4 ring-red-500 ring-offset-2 ring-offset-background animate-pulse" 
                  : "ring-2 ring-white/10"
              }`}
            />
            {isLive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-500 text-[9px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wider ring-2 ring-background whitespace-nowrap z-10">
                Watch Live
              </span>
            )}
          </div>
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
          {meta.label}
        </div>
      </div>
    </motion.button>
  );
}

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
      {ORDER.map((idx) => (
        <PodiumItem
          key={top3[idx].id}
          creator={top3[idx]}
          meta={META[idx]}
          idx={idx}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
