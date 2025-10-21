// YouTube URL parsing and embedding utilities

export interface YouTubeVideo {
  id: string;
  title: string;
  url: string;
  embedUrl: string;
}

export interface YouTubePlaylist {
  id: string;
  title: string;
  videos: YouTubeVideo[];
}

// Extract YouTube video ID from various URL formats
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*&v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Extract YouTube playlist ID from URL
export function extractYouTubePlaylistId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/playlist\?list=|youtube\.com\/watch\?.*&list=)([^&\n?#]+)/,
    /youtube\.com\/embed\/videoseries\?list=([^&\n?#]+)/,
    /youtube\.com\/watch\?.*list=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      console.log('Found playlist ID:', match[1], 'from URL:', url);
      return match[1];
    }
  }

  console.log('No playlist ID found in URL:', url);
  return null;
}

// Check if URL is a YouTube video
export function isYouTubeVideo(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}

// Check if URL is a YouTube playlist
export function isYouTubePlaylist(url: string): boolean {
  return extractYouTubePlaylistId(url) !== null;
}

// Generate YouTube embed URL for a video
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

// Generate YouTube embed URL for a playlist
export function getYouTubePlaylistEmbedUrl(playlistId: string): string {
  return `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
}

// Parse YouTube URL and return video info
export function parseYouTubeVideo(url: string): YouTubeVideo | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  return {
    id: videoId,
    title: `YouTube Video (${videoId})`, // Will be updated with actual title
    url: url,
    embedUrl: getYouTubeEmbedUrl(videoId)
  };
}

// Parse YouTube playlist URL
export function parseYouTubePlaylist(url: string): YouTubePlaylist | null {
  const playlistId = extractYouTubePlaylistId(url);
  if (!playlistId) return null;

  return {
    id: playlistId,
    title: `YouTube Playlist (${playlistId})`, // Will be updated with actual title
    videos: []
  };
}

// Fetch YouTube video details using YouTube Data API
export async function fetchYouTubeVideoDetails(videoId: string, apiKey?: string): Promise<{ title: string; duration?: string } | null> {
  if (!apiKey) {
    // Return basic info without API call
    return {
      title: `YouTube Video (${videoId})`,
      duration: undefined
    };
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails`
    );
    
    if (!response.ok) {
      console.warn('YouTube API request failed:', response.status);
      return {
        title: `YouTube Video (${videoId})`,
        duration: undefined
      };
    }

    const data = await response.json();
    const video = data.items?.[0];
    
    if (!video) {
      return {
        title: `YouTube Video (${videoId})`,
        duration: undefined
      };
    }

    return {
      title: video.snippet.title,
      duration: video.contentDetails?.duration
    };
  } catch (error) {
    console.error('Error fetching YouTube video details:', error);
    return {
      title: `YouTube Video (${videoId})`,
      duration: undefined
    };
  }
}

// Fetch YouTube playlist details and videos
export async function fetchYouTubePlaylistDetails(playlistId: string, apiKey?: string): Promise<YouTubePlaylist | null> {
  if (!apiKey) {
    // Return basic info without API call
    return {
      id: playlistId,
      title: `YouTube Playlist (${playlistId})`,
      videos: []
    };
  }

  try {
    // First, get playlist details
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?id=${playlistId}&key=${apiKey}&part=snippet`
    );

    if (!playlistResponse.ok) {
      console.warn('YouTube Playlist API request failed:', playlistResponse.status);
      return {
        id: playlistId,
        title: `YouTube Playlist (${playlistId})`,
        videos: []
      };
    }

    const playlistData = await playlistResponse.json();
    const playlist = playlistData.items?.[0];
    
    if (!playlist) {
      return {
        id: playlistId,
        title: `YouTube Playlist (${playlistId})`,
        videos: []
      };
    }

    // Then, get playlist videos
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${playlistId}&key=${apiKey}&part=snippet&maxResults=50`
    );

    if (!videosResponse.ok) {
      console.warn('YouTube Playlist Videos API request failed:', videosResponse.status);
      return {
        id: playlistId,
        title: playlist.snippet.title,
        videos: []
      };
    }

    const videosData = await videosResponse.json();
    const videos: YouTubeVideo[] = videosData.items?.map((item: any) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
      embedUrl: getYouTubeEmbedUrl(item.snippet.resourceId.videoId)
    })) || [];

    return {
      id: playlistId,
      title: playlist.snippet.title,
      videos
    };
  } catch (error) {
    console.error('Error fetching YouTube playlist details:', error);
    return {
      id: playlistId,
      title: `YouTube Playlist (${playlistId})`,
      videos: []
    };
  }
}

// Convert YouTube URL to embed format
export function convertToYouTubeEmbed(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (videoId) {
    return getYouTubeEmbedUrl(videoId);
  }

  const playlistId = extractYouTubePlaylistId(url);
  if (playlistId) {
    return getYouTubePlaylistEmbedUrl(playlistId);
  }

  return null;
}

// Check if a URL can be embedded as YouTube
export function canEmbedAsYouTube(url: string): boolean {
  return isYouTubeVideo(url) || isYouTubePlaylist(url);
}

// Parse custom format: "Title:URL"
export function parseCustomFormat(line: string): { title: string; url: string } | null {
  const trimmedLine = line.trim();
  if (!trimmedLine) return null;

  // First, try to split by the last colon (most common format: "Title:URL")
  const lastColonIndex = trimmedLine.lastIndexOf(':');
  
  if (lastColonIndex !== -1) {
    const title = trimmedLine.substring(0, lastColonIndex).trim();
    const url = trimmedLine.substring(lastColonIndex + 1).trim();
    
    // Validate that the URL part actually looks like a URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.log('Parsing line:', trimmedLine);
      console.log('  Title:', title);
      console.log('  URL:', url);
      
      return { 
        title: title || 'Video', 
        url: url 
      };
    }
  }

  // Fallback: Check if the line contains a URL pattern
  const urlPattern = /https?:\/\/[^\s]+/;
  const urlMatch = trimmedLine.match(urlPattern);
  
  if (!urlMatch) {
    // No URL found, treat as raw text
    console.log('No URL found in line:', trimmedLine);
    return {
      title: trimmedLine,
      url: ''
    };
  }

  const url = urlMatch[0];
  const title = trimmedLine.replace(url, '').trim();
  
  // Remove trailing colon if present
  const cleanTitle = title.replace(/:\s*$/, '').trim();
  
  console.log('Parsing line (fallback):', trimmedLine);
  console.log('  URL found:', url);
  console.log('  Title before cleanup:', title);
  console.log('  Clean title:', cleanTitle);
  
  if (!cleanTitle) {
    return {
      title: 'Video',
      url: url
    };
  }

  return { title: cleanTitle, url };
}

// Parse bulk YouTube links in custom format
export function parseBulkYouTubeLinks(text: string): { title: string; url: string }[] {
  const lines = text.split('\n').filter(line => line.trim());
  const parsedLinks: { title: string; url: string }[] = [];

  console.log('Parsing bulk text with', lines.length, 'lines');
  
  for (const line of lines) {
    const parsed = parseCustomFormat(line);
    if (parsed && parsed.url) {
      parsedLinks.push(parsed);
      console.log('  Added:', parsed.title, '->', parsed.url);
    } else {
      console.log('  Skipped line (no valid URL):', line);
    }
  }

  console.log('Total parsed links:', parsedLinks.length);
  return parsedLinks;
}

// Validate if a parsed link is a valid YouTube URL
export function validateYouTubeLink(parsedLink: { title: string; url: string }): boolean {
  return isYouTubeVideo(parsedLink.url) || isYouTubePlaylist(parsedLink.url);
}

// Call backend API to process YouTube playlist
export async function processYouTubePlaylist(playlistUrl: string): Promise<{ title: string; url: string; type: 'youtube'; requiresCookies: boolean }[]> {
  try {
    // Extract playlist ID from URL
    const playlistIdMatch = playlistUrl.match(/[?&]list=([^&]+)/);
    if (!playlistIdMatch) {
      // If no playlist ID found, treat as single video
      return [{
        title: 'YouTube Video',
        url: playlistUrl.trim(),
        type: 'youtube',
        requiresCookies: false
      }];
    }

    const playlistId = playlistIdMatch[1];
    console.log('Processing YouTube playlist with ID:', playlistId);

    // Call backend API to get playlist details
    const response = await fetch(`/api/youtube/playlist/${playlistId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch playlist details:', response.status);
      // Fallback to basic playlist link
      return [{
        title: 'YouTube Playlist',
        url: playlistUrl.trim(),
        type: 'youtube',
        requiresCookies: false
      }];
    }

    const playlistData = await response.json();
    console.log('Playlist data received:', playlistData);

    // Convert playlist videos to our format
    const videoLinks = playlistData.videos?.map((video: any) => ({
      title: video.title || 'YouTube Video',
      url: video.url || `https://www.youtube.com/watch?v=${video.id}`,
      type: 'youtube' as const,
      requiresCookies: false
    })) || [];

    console.log('Processed video links:', videoLinks);
    return videoLinks;

  } catch (error) {
    console.error('Error processing YouTube playlist:', error);
    // Fallback to basic playlist link
    return [{
      title: 'YouTube Playlist',
      url: playlistUrl.trim(),
      type: 'youtube',
      requiresCookies: false
    }];
  }
} 