// API utility functions for making requests to the backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Validate required environment variables
if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL or VITE_BACKEND_URL environment variable is required');
}
if (!API_URL) {
  throw new Error('VITE_API_URL environment variable is required');
}

/**
 * Make an API request to the backend
 */
export const apiRequest = async (
  method: string,
  endpoint: string,
  data?: unknown,
  options: RequestInit = {}
): Promise<Response> => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  // Check if data is FormData to avoid setting Content-Type header
  const isFormData = data instanceof FormData;
  
  const response = await fetch(url, {
    method,
    headers: {
      // Don't set Content-Type for FormData - let browser set it with boundary
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
    body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    credentials: 'include',
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }

  return response;
};

/**
 * Make a GET request to the API
 */
export const apiGet = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  return apiRequest('GET', endpoint, undefined, options);
};

/**
 * Make a POST request to the API
 */
export const apiPost = async (endpoint: string, data?: unknown, options?: RequestInit): Promise<Response> => {
  return apiRequest('POST', endpoint, data, options);
};

/**
 * Make a PUT request to the API
 */
export const apiPut = async (endpoint: string, data?: unknown, options?: RequestInit): Promise<Response> => {
  return apiRequest('PUT', endpoint, data, options);
};

/**
 * Make a DELETE request to the API
 */
export const apiDelete = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  return apiRequest('DELETE', endpoint, undefined, options);
};

/**
 * Get the full API URL for an endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  return endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
};

/**
 * Get the base API URL
 */
export const getApiBaseUrl = (): string => {
  return API_BASE_URL;
};

/**
 * Helper function to build full API URL from endpoint
 */
export const buildApiUrl = (endpoint: string): string => {
  return endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
};
