import { useEffect, useRef, useState } from "react";
import type { Creator, LiveCreator } from "./types";

export function useLiveCreators(
  seed: Creator[],
  liveStatus: { handle: string; isLive: boolean }[] = []
): LiveCreator[] {
  const [subs, setSubs] = useState<Record<string, number>>({});
  const [deltas, setDeltas] = useState<Record<string, number>>({});
  const prevRanksRef = useRef<Record<string, number>>({});

  // Create a map for quick live status lookups
  const liveMap = new Map(liveStatus.map((s) => [s.handle.toLowerCase(), s.isLive]));

  useEffect(() => {
    setSubs((prev) => {
      const next = { ...prev };
      const d: Record<string, number> = {};
      for (const c of seed) {
        const change = c.subscribers - (prev[c.id] ?? c.subscribers);
        next[c.id] = c.subscribers;
        d[c.id] = change;
      }
      setDeltas(d);
      return next;
    });
  }, [seed]);

  const merged = seed
    .map((c) => ({
      ...c,
      subscribers: subs[c.id] ?? c.subscribers,
      delta: deltas[c.id] ?? 0,
      // Override isLive with real-time data if available
      isLive: liveMap.has(c.handle.toLowerCase()) ? liveMap.get(c.handle.toLowerCase())! : c.isLive,
    }))
    .sort((a, b) => b.subscribers - a.subscribers);

  const result: LiveCreator[] = merged.map((c, i) => {
    const rank = i + 1;
    const previousRank = prevRanksRef.current[c.id] ?? rank;
    return { ...c, rank, previousRank };
  });

  // update refs after computing
  const newRanks: Record<string, number> = {};
  result.forEach((c) => (newRanks[c.id] = c.rank));
  prevRanksRef.current = newRanks;

  return result;
}
