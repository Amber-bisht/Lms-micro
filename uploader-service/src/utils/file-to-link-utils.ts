// Server-side FileToLink utilities

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
  return {
    access_token: `token_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`,
    user_session: `session_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`,
    auth_key: `auth_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`
  };
}

/**
 * Check if a URL is a FileToLink URL
 */
export function isFileToLinkUrl(url: string): boolean {
  // Add your FileToLink domain here
  const fileToLinkDomains = [
    'your-filetolink-domain.com',
    'localhost:8080', // for local development
    '127.0.0.1:8080'
  ];
  
  try {
    const urlObj = new URL(url);
    return fileToLinkDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Create cookie header string from cookies object
 */
export function createCookieHeader(cookies: FileToLinkCookies): string {
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

