export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: string;
  embedUrl: string;
}

export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export function generateYouTubeEmbedUrl(videoId: string, options?: {
  autoplay?: boolean;
  controls?: boolean;
  start?: number;
  end?: number;
  loop?: boolean;
  mute?: boolean;
}): string {
  const baseUrl = `https://www.youtube.com/embed/${videoId}`;
  const params = new URLSearchParams();

  if (options?.autoplay) params.append('autoplay', '1');
  if (options?.controls !== undefined) params.append('controls', options.controls ? '1' : '0');
  if (options?.start) params.append('start', options.start.toString());
  if (options?.end) params.append('end', options.end.toString());
  if (options?.loop) params.append('loop', '1');
  if (options?.mute) params.append('mute', '1');

  // Add additional parameters for better embed experience
  params.append('rel', '0'); // Don't show related videos
  params.append('modestbranding', '1'); // Minimal YouTube branding
  params.append('fs', '1'); // Allow fullscreen

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export function generateYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'high'): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}

export function getYouTubeVideoInfo(url: string): YouTubeVideoInfo | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  return {
    videoId,
    title: '', // Would need YouTube API to get actual title
    thumbnail: generateYouTubeThumbnail(videoId),
    duration: '', // Would need YouTube API to get actual duration
    embedUrl: generateYouTubeEmbedUrl(videoId)
  };
}
