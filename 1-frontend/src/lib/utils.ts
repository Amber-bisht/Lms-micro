import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API request utility function
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
  
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL or VITE_BACKEND_URL environment variable is required');
  }
  
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  const response = await fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
};

// Query function for React Query
export const getQueryFn = (url: string) => async () => {
  return apiRequest(url, {
    credentials: 'include'
  });
};
