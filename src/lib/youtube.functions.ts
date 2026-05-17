import { createServerFn } from "@tanstack/react-start";
import type { Creator } from "@/components/leaderboard/types";

function parseCount(raw: string): number {
  const s = raw.replace(/,/g, "").trim();
  const m = s.match(/^([\d.]+)\s*([KMB]?)/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const mult: Record<string, number> = { K: 1e3, M: 1e6, B: 1e9 };
  return Math.round(n * (mult[m[2]?.toUpperCase()] ?? 1));
}

function pick(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return m[1];
  }
  return null;
}

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
    "roleplay": "RP",
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

async function fetchChannel(url: string, idx: number): Promise<Creator | null> {
  try {
    const base = url.replace(/\/+$/, "");
    const aboutUrl = `${base}/about?hl=en&gl=US`;
    const res = await fetch(aboutUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const name =
      pick(html, [
        /<meta property="og:title" content="([^"]+)"/,
        /"channelMetadataRenderer":\{"title":"([^"]+)"/,
      ]) ?? base.split("@").pop() ?? "Unknown";

    const avatar =
      pick(html, [
        /<meta property="og:image" content="([^"]+)"/,
        /"avatar":\{"thumbnails":\[\{"url":"([^"]+)"/,
      ]) ?? "";

    const description =
      pick(html, [
        /<meta property="og:description" content="([^"]+)"/,
        /<meta name="description" content="([^"]+)"/,
      ]) ?? "";

    const keywords = pick(html, [/<meta name="keywords" content="([^"]+)"/]);

    const subsRaw =
      pick(html, [
        /"subscriberCountText":\{[^}]*"simpleText":"([^"]+)"/,
        /"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"/,
        /"metadataParts":\[[^\]]*"text":\{"content":"([\d.,]+[KMB]?) subscribers"/,
        /([\d.,]+[KMB]?)\s+subscribers/i,
      ]) ?? "0";

    const viewsRaw =
      pick(html, [
        /"viewCountText":\{"simpleText":"([^"]+)"/,
        /"viewCount":"([\d]+)"/,
        /([\d,]+)\s+views/i,
      ]) ?? "0";

    const videosRaw =
      pick(html, [
        /"videoCountText":\{"runs":\[\{"text":"([^"]+)"/,
        /"videosCountText":\{"runs":\[\{"text":"([^"]+)"/,
        /"videoCount":"([\d]+)"/,
        /([\d,]+)\s+videos/i,
      ]) ?? "0";

    const verified = /"BADGE_STYLE_TYPE_VERIFIED"|"VERIFIED_ARTIST"/.test(html);

    const handleMatch = base.match(/@([^/]+)/);
    const handle = handleMatch ? `@${handleMatch[1]}` : base.replace(/^https?:\/\//, "");

    return {
      id: handle.toLowerCase() + "-" + idx,
      name,
      handle,
      url: base,
      avatar,
      subscribers: parseCount(subsRaw),
      views: parseCount(viewsRaw),
      videos: parseCount(videosRaw),
      niche: deriveNiche(name, description, keywords),
      verified,
      trending: "up",
      description,
    };
  } catch (e) {
    console.error("fetchChannel failed", url, e);
    return null;
  }
}

export const fetchChannels = createServerFn({ method: "POST" })
  .inputValidator((data: { urls: string[] }) => {
    if (!Array.isArray(data?.urls)) throw new Error("urls must be an array");
    return { urls: data.urls.slice(0, 50).filter((u) => typeof u === "string") };
  })
  .handler(async ({ data }) => {
    const results = await Promise.all(data.urls.map((u, i) => fetchChannel(u, i)));
    return results.filter((c): c is Creator => c !== null);
  });