import creatorUrls from "../src/data/creators.json";

async function checkIsLive(handle: string): Promise<boolean> {
  try {
    const url = `https://www.youtube.com/${handle}/live`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    const text = await res.text();
    return text.includes('isLiveNow":true') || text.includes('hlsManifestUrl') || text.includes('liveBroadcastDetails');
  } catch (e) {
    return false;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const statusResults = await Promise.all(
      (creatorUrls as string[]).map(async (url) => {
        const handleMatch = url.match(/@([^/]+)/);
        if (!handleMatch) return null;
        const handle = `@${handleMatch[1]}`;
        const isLive = await checkIsLive(handle);
        return { handle, isLive };
      })
    );

    const liveData = statusResults.filter(Boolean);

    // Cache live status for only 1 minute
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
    return res.status(200).json(liveData);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch live status" });
  }
}
