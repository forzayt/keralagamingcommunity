import { useState, useEffect } from "react";

const statusCache: Record<string, { isLive: boolean; timestamp: number }> = {};
const CACHE_DURATION = 60000; // 1 minute

export function useLiveStatus(channelUrl: string) {
  const [isLive, setIsLive] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!channelUrl) return;

    // Check cache first
    const cached = statusCache[channelUrl];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setIsLive(cached.isLive);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function checkStatus() {
      try {
        setIsLoading(true);
        // We use a CORS proxy to check the live status of the YouTube channel
        // YouTube's /live URL redirects to the active stream if the channel is live
        const liveUrl = `${channelUrl.replace(/\/$/, "")}/live`;
        
        // Using a public CORS proxy for the check
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(liveUrl)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Proxy request failed");
        
        const data = await response.json();
        const content = data.contents;
        
        // Check for indicators of a live stream in the page content
        // "liveStreamabilityRenderer" is a common indicator in YouTube's internal data
        // "isLive":true is another one
        const liveIndicator = content.includes('liveStreamabilityRenderer') || 
                             content.includes('"isLive":true') ||
                             content.includes('videoIsLive":true');

        if (isMounted) {
          statusCache[channelUrl] = { isLive: liveIndicator, timestamp: Date.now() };
          setIsLive(liveIndicator);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error checking live status:", error);
        if (isMounted) {
          statusCache[channelUrl] = { isLive: false, timestamp: Date.now() };
          setIsLive(false);
          setIsLoading(false);
        }
      }
    }

    if (channelUrl) {
      checkStatus();
    }
  }, [channelUrl]);

  return { isLive, isLoading };
}
