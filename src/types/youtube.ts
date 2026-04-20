export interface YouTubeChannel {
  id: string;
  channelName: string;
  channelUrl: string;
  description: string;
  topics: string[];
  rating?: number;
  createdAt: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  videoUrl: string;
  channelName: string;
  topic: string;
  notes?: string;
  watchedAt?: string;
  rating?: number;
  createdAt: string;
}
