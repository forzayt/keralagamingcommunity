import creatorUrls from "../src/data/creators.json";

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

async function fetchChannel(url: string, idx: number, apiKey: string) {
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
      verified: true,
      trending: "up",
      description: snippet.description,
    };
  } catch (e) {
    console.error("fetchChannel failed", url, e);
    return null;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "YouTube API Key not configured in Vercel Environment Variables" });
  }

  try {
    const validUrls = (creatorUrls as string[]).slice(0, 50);
    const results = await Promise.all(validUrls.map((u, i) => fetchChannel(u, i, apiKey)));
    const creators = results.filter((c) => c !== null);

    // Cache on Vercel CDN for 1 day (86400 seconds)
    // stale-while-revalidate=3600 allows serving stale content while refetching in the background
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=3600");
    return res.status(200).json(creators);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch channels" });
  }
}
