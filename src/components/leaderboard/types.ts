export type Trend = "up" | "down" | "flat";

export interface Creator {
  id: string;
  name: string;
  handle: string;
  url: string;
  avatar: string;
  subscribers: number;
  views: number;
  videos: number;
  niche: string[];
  verified: boolean;
  trending: Trend;
  description: string;
}

export interface LiveCreator extends Creator {
  delta: number;
  previousRank: number;
  rank: number;
}