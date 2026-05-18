import type { Creator } from "@/components/leaderboard/types";

function deriveNiche(name: string, description: string, keywords: string | null): string[] {
  const haystack = `${name} ${description} ${keywords ?? ""}`.toLowerCase();
  const map: Record<string, string> = {
    bgmi: "BGMI",
    pubg: "PUBG",
    "free fire": "Free Fire",
    freefire: "Free Fire",
    valorant: "Valorant",
    minecraft: "Minecraft",
    gta: "GTA",
    fortnite: "Fortnite",
    apex: "Apex",
    cod: "COD",
    "call of duty": "COD",
    fifa: "FIFA",
    fps: "FPS",
    roleplay: "RP",
    "mobile legends": "MLBB",
    mlbb: "MLBB",
    horror: "Horror",
    souls: "Souls",
    rpg: "RPG",
    fighting: "Fighting",
    tekken: "Fighting",
    esports: "Esports",
  };
  const found = new Set<string>();
  for (const [k, v] of Object.entries(map)) {
    if (haystack.includes(k)) found.add(v);
  }
  if (found.size === 0) found.add("Gaming");
  return Array.from(found).slice(0, 3);
}

async function fetchChannel(url: string, idx: number, apiKey: string): Promise<Creator | null> {
  try {
    const base = url.replace(/\/+$/, "");
    let apiUrl = "";
    let handle = "";

    const handleMatch = base.match(/@([^/]+)/);
    if (handleMatch) {
      handle = `@${handleMatch[1]}`;
      // API v3 uses forHandle parameter without the @ symbol
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${handleMatch[1]}&key=${apiKey}`;
    } else {
      const idMatch = base.match(/channel\/([^/]+)/);
      if (idMatch) {
        handle = base.replace(/^https?:\/\//, "");
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${idMatch[1]}&key=${apiKey}`;
      } else {
        return null;
      }
    }

    const res = await fetch(apiUrl);
    if (!res.ok) return null;
    const data = await res.json();

    if (!data.items || data.items.length === 0) return null;

    const channel = data.items[0];
    const snippet = channel.snippet;
    const stats = channel.statistics;

    return {
      id: handle.toLowerCase() + "-" + idx,
      name: snippet.title,
      handle,
      url: base,
      avatar: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
      subscribers: parseInt(stats.subscriberCount || "0", 10),
      views: parseInt(stats.viewCount || "0", 10),
      videos: parseInt(stats.videoCount || "0", 10),
      niche: deriveNiche(snippet.title, snippet.description, null),
      verified: true, // You can assume true for large channels, or leave false. YouTube API doesn't provide a direct flag.
      trending: "up",
      description: snippet.description,
    };
  } catch (e) {
    console.error("fetchChannel failed", url, e);
    return null;
  }
}

export const fetchChannels = async (data: { urls: string[] }): Promise<Creator[]> => {
  if (!Array.isArray(data?.urls)) throw new Error("urls must be an array");

  // 1. Try to fetch from the cached Vercel Serverless Function first
  try {
    const res = await fetch("/api/channels");
    const contentType = res.headers.get("content-type");

    // Check if it's JSON to avoid parsing Vite's HTML SPA fallback in local dev
    if (res.ok && contentType && contentType.includes("application/json")) {
      const apiData = await res.json();
      if (Array.isArray(apiData)) {
        return apiData;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch from Vercel API, falling back to client-side fetch", e);
  }

  // 2. Fallback / Local Development: Client-side fetch
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("VITE_YOUTUBE_API_KEY is not defined in your environment variables.");
    return [];
  }

  const validUrls = data.urls.slice(0, 50).filter((u) => typeof u === "string");
  const results = await Promise.all(validUrls.map((u, i) => fetchChannel(u, i, apiKey)));
  return results.filter((c): c is Creator => c !== null);
};
