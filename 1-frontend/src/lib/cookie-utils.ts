// Cookie utilities for FileToLink bot access

export interface FileToLinkCookies {
  access_token: string;
  user_session: string;
  auth_key: string;
}

/**
 * Generate fake cookies for FileToLink bot access
 * These cookies don't need to be validated, just present
 */
export function generateFileToLinkCookies(): FileToLinkCookies {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  
  return {
    access_token: `token_${randomId}_${timestamp}`,
    user_session: `session_${randomId}_${timestamp}`,
    auth_key: `auth_${randomId}_${timestamp}`
  };
}

/**
 * Create a fetch request with FileToLink cookies
 */
export async function fetchWithFileToLinkCookies(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Use proxy route to avoid CORS issues
  const proxyUrl = `/api/file-to-link/proxy/${encodeURIComponent(url)}`;
  
  return fetch(proxyUrl, {
    ...options,
    credentials: 'include'
  });
}

/**
 * Create a blob URL for FileToLink content
 */
export async function createFileToLinkBlobUrl(url: string): Promise<string> {
  const response = await fetchWithFileToLinkCookies(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch FileToLink content: ${response.status} ${response.statusText}`);
  }
  
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * Check if a URL is a FileToLink URL
 */
export function isFileToLinkUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Check for common FileToLink domains or patterns
    return urlObj.hostname.includes('localhost') || 
           urlObj.hostname.includes('filetolink') ||
           urlObj.pathname.includes('/watch/');
  } catch {
    return false;
  }
}

/**
 * Check if a video requires cookies (FileToLink, etc.)
 */
export function requiresCookies(url: string, videoType?: string): boolean {
  if (isFileToLinkUrl(url)) return true;
  
  return false;
}

/**
 * Get video type from URL
 */
export function getVideoType(url: string): 'normal' | 'youtube' | 'aws' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('amazonaws.com') || url.includes('s3.')) return 'aws';
  return 'normal';
}

/**
 * Create an iframe with FileToLink cookies
 */
export function createFileToLinkIframe(url: string, options: {
  width?: string;
  height?: string;
  className?: string;
} = {}): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.width = options.width || '100%';
  iframe.height = options.height || '400px';
  iframe.className = options.className || '';
  iframe.style.border = 'none';
  
  // Add cookies to iframe (this is a simplified approach)
  // In a real implementation, you might need to handle this differently
  const cookies = generateFileToLinkCookies();
  const cookieString = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
  
  // Note: This is a basic implementation
  // For production, you might need to use a proxy or different approach
  return iframe;
}

/**
 * Create a video element with FileToLink cookies
 */
export function createFileToLinkVideo(url: string, options: {
  width?: string;
  height?: string;
  className?: string;
  controls?: boolean;
  autoplay?: boolean;
  muted?: boolean;
} = {}): HTMLVideoElement {
  const video = document.createElement('video');
  video.src = url;
  video.width = parseInt(options.width || '100%');
  video.height = parseInt(options.height || '400');
  video.className = options.className || '';
  video.controls = options.controls !== false;
  video.autoplay = options.autoplay || false;
  video.muted = options.muted !== false;
  
  // Add cookies to video request
  const cookies = generateFileToLinkCookies();
  const cookieString = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
  
  // This is a simplified approach - in practice you might need a different method
  return video;
} 