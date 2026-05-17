import { useEffect, useRef, useState } from "react";
import type { Creator, LiveCreator } from "./types";

export function useLiveCreators(seed: Creator[]): LiveCreator[] {
  const [subs, setSubs] = useState<Record<string, number>>({});
  const [deltas, setDeltas] = useState<Record<string, number>>({});
  const prevRanksRef = useRef<Record<string, number>>({});

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
    .map((c) => ({ ...c, subscribers: subs[c.id] ?? c.subscribers, delta: deltas[c.id] ?? 0 }))
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