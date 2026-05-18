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
      const controllers: AbortController[] = [];

      const fetchWithTimeout = async (url: string, timeout = 8000) => {
        const controller = new AbortController();
        controllers.push(controller);
        const id = setTimeout(() => controller.abort(), timeout);
        try {
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(id);
          return response;
        } catch (e) {
          clearTimeout(id);
          throw e;
        }
      };

      const fetchWithProxy = async (proxyFn: (url: string) => string, isAllOrigins: boolean) => {
        const proxyUrl = proxyFn(liveUrl);
        try {
          const response = await fetchWithTimeout(proxyUrl);
          if (!response.ok) throw new Error(`Proxy failed: ${proxyUrl}`);
          
          let content = "";
          if (isAllOrigins) {
            const data = await response.json();
            content = data.contents;
          } else {
            content = await response.text();
          }

          if (!content || content.length < 100) {
            throw new Error("Empty or too short content from proxy");
          }
          return content;
        } catch (err) {
          throw err;
        }
      };

      const proxies = [
        { fn: (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`, isAllOrigins: false },
        { fn: (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, isAllOrigins: true },
        { fn: (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`, isAllOrigins: false },
        { fn: (url: string) => `https://api.cors.lol/?url=${encodeURIComponent(url)}`, isAllOrigins: false }
      ];

      try {
        setIsLoading(true);
        
        // Try all proxies in parallel and take the first one that succeeds
        const content = await Promise.any(
          proxies.map(proxy => fetchWithProxy(proxy.fn, proxy.isAllOrigins))
        );

        // Abort other pending requests
        controllers.forEach(c => c.abort());

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
        if (isMounted) {
          console.error("Error checking live status:", error);
          statusCache[channelUrl] = { isLive: false, timestamp: Date.now() };
          setIsLive(false);
          setIsLoading(false);
        }
      } finally {
        controllers.forEach(c => c.abort());
      }
    }

    if (channelUrl) {
      checkStatus();
    }

    return () => {
      isMounted = false;
    };
  }, [channelUrl]);

  return { isLive, isLoading };
}
