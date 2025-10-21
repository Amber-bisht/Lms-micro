import React from 'react';
import { AlertTriangle, Clock, Ban } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface RateLimitErrorProps {
  action: string;
  remainingTime?: number;
  onRetry?: () => void;
  className?: string;
}

const errorMessages: Record<string, { title: string; description: string }> = {
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

const formatRemainingTime = (ms: number): string => {
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

export const RateLimitError: React.FC<RateLimitErrorProps> = ({
  action,
  remainingTime,
  onRetry,
  className = ''
}) => {
  const { title, description } = errorMessages[action] || errorMessages['general'];
  const timeText = remainingTime ? formatRemainingTime(remainingTime) : '24 hours';

  return (
    <Alert className={`border-red-200 bg-red-50 ${className}`}>
      <Ban className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-800">{title}</AlertTitle>
      <AlertDescription className="text-red-700 mt-2">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4" />
          <span>Wait time: {timeText}</span>
        </div>
        <p>{description}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
          >
            Try Again Later
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default RateLimitError;
