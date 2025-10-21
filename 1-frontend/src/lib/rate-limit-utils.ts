import { toast } from '@/hooks/use-toast';

export interface RateLimitError {
  message: string;
  action: string;
  limited: boolean;
  remainingTime?: number;
  error: string;
}

export const isRateLimitError = (error: any): boolean => {
  return error?.error === 'RATE_LIMIT_EXCEEDED' || 
         error?.message?.includes('Rate limit exceeded') ||
         error?.message?.includes('RATE_LIMIT_EXCEEDED');
};

export const handleRateLimitError = (error: any, action: string = 'action') => {
  if (isRateLimitError(error)) {
    const rateLimitError = error as RateLimitError;
    const actionText = getActionText(rateLimitError.action || action);
    
    toast({
      title: actionText.title,
      description: actionText.description,
      variant: "destructive",
    });
    
    return true; // Error was handled
  }
  
  return false; // Error was not a rate limit error
};

const getActionText = (action: string): { title: string; description: string } => {
  const rateLimitMessages: Record<string, { title: string; description: string }> = {
    'blog_listing': {
      title: 'Rate Limit Reached',
      description: 'Too many requests for blog listing. Please try again later.'
    },
    'featured_blogs': {
      title: 'Rate Limit Reached',
      description: 'Too many requests for featured blogs. Please try again later.'
    },
    'blogs_by_type': {
      title: 'Rate Limit Reached',
      description: 'Too many requests for blogs by type. Please try again later.'
    },
    'blog_search': {
      title: 'Rate Limit Reached',
      description: 'Too many search requests. Please try again later.'
    },
    'blog_by_slug': {
      title: 'Rate Limit Reached',
      description: 'Too many requests for this blog. Please try again later.'
    },
    'blog_by_id': {
      title: 'Rate Limit Reached',
      description: 'Too many requests for this blog. Please try again later.'
    },
    'course_listing': {
      title: 'Rate Limit Reached',
      description: 'Too many requests for course listing. Please try again later.'
    },
    'course_search': {
      title: 'Rate Limit Reached',
      description: 'Too many course search requests. Please try again later.'
    },
    'course_by_slug': {
      title: 'Rate Limit Reached',
      description: 'Too many requests for this course. Please try again later.'
    },
    'course_by_id': {
      title: 'Rate Limit Reached',
      description: 'Too many requests for this course. Please try again later.'
    },
    'course_review': {
      title: 'Course Review Limit Reached',
      description: 'Aapne 10 baar course review kar liya hai. Kal tak wait karein.'
    },
    'course_enrollment': {
      title: 'Course Enrollment Limit Reached',
      description: 'Aapne 25 baar course enrollment kar liya hai. Kal tak wait karein.'
    },
    'video_upload': {
      title: 'Video Upload Limit Reached',
      description: 'Aapne 10 baar video upload kar liya hai. Kal tak wait karein.'
    },
    'comment': {
      title: 'Comment Limit Reached',
      description: 'Aapne 20 baar comment kar liya hai. 15 minute tak wait karein.'
    },
    'contact': {
      title: 'Contact Limit Reached',
      description: 'Aapne 3 baar contact kar liya hai. Kal tak wait karein.'
    },
    'copyright': {
      title: 'Copyright Limit Reached',
      description: 'Aapne 3 baar copyright request kar liya hai. Kal tak wait karein.'
    },
    'general': {
      title: 'Rate Limit Reached',
      description: 'Too many requests. Please try again later.'
    }
  };

  return rateLimitMessages[action] || {
    title: 'Rate Limit Reached',
    description: 'Aapne maximum attempts kar liye hain. Kal tak wait karein.'
  };
};

export const formatRemainingTime = (ms: number): string => {
  if (ms === 0) return '0 seconds';
  
  const seconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} din`;
  if (hours > 0) return `${hours} ghante`;
  if (minutes > 0) return `${minutes} minute`;
  return `${seconds} second`;
};
