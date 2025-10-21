/**
 * Utility functions for handling category redirects using proper client-side routing
 */

/**
 * Gets the category URL for use in href attributes or navigation
 * @param categorySlug - The category slug
 * @param additionalParams - Optional additional parameters
 */
export const getCategoryUrl = (categorySlug: string, additionalParams?: string) => {
  if (categorySlug === 'all') {
    return '/r';
  }
  
  return `/r/${categorySlug}`;
};

/**
 * Handles category click with proper navigation (for use with useLocation hook)
 * @param categorySlug - The category slug
 * @param navigate - The navigate function from useLocation hook
 * @param additionalParams - Optional additional parameters
 */
export const handleCategoryClick = (categorySlug: string, navigate: (path: string) => void, additionalParams?: string) => {
  if (categorySlug === 'all') {
    navigate('/r');
    return;
  }
  
  navigate(`/r/${categorySlug}`);
};
