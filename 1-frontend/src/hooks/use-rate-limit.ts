import { useCallback } from 'react';
import { handleRateLimitError } from '@/lib/rate-limit-utils';

export const useRateLimit = () => {
  const handleError = useCallback((error: any, action: string = 'action') => {
    return handleRateLimitError(error, action);
  }, []);

  const isRateLimited = useCallback((error: any): boolean => {
    return error?.error === 'RATE_LIMIT_EXCEEDED' || 
           error?.message?.includes('Rate limit exceeded') ||
           error?.message?.includes('RATE_LIMIT_EXCEEDED');
  }, []);

  return {
    handleError,
    isRateLimited
  };
};
