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
      const liveUrl = `${channelUrl.replace(/\/$/, "")}/live`;
      
      const fetchWithProxy = async (proxyFn: (url: string) => string, isAllOrigins: boolean) => {
        const proxyUrl = proxyFn(liveUrl);
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Proxy failed: ${proxyUrl}`);
        
        if (isAllOrigins) {
          const data = await response.json();
          return data.contents;
        }
        return await response.text();
      };

      const proxies = [
        { fn: (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`, isAllOrigins: false },
        { fn: (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, isAllOrigins: true },
        { fn: (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`, isAllOrigins: false }
      ];

      try {
        setIsLoading(true);
        let content = "";
        let success = false;

        for (const proxy of proxies) {
          try {
            content = await fetchWithProxy(proxy.fn, proxy.isAllOrigins);
            if (content) {
              success = true;
              break;
            }
          } catch (e) {
            console.warn(`Proxy failed, trying next...`, e);
            continue;
          }
        }

        if (!success) throw new Error("All proxies failed");
        
        // Check for indicators of a live stream in the page content
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
