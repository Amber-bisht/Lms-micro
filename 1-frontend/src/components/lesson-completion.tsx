import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Undo } from 'lucide-react';
import { useCourseCompletion } from '@/hooks/use-course-completion';

interface LessonCompletionProps {
  courseId: string;
  lessonId: string;
  className?: string;
  showText?: boolean;
}

export const LessonCompletion: React.FC<LessonCompletionProps> = ({
  courseId,
  lessonId,
  className = '',
  showText = true,
}) => {
  const {
    isLessonCompleted,
    markLessonCompleted,
    markLessonIncomplete,
    isLoading,
  } = useCourseCompletion(courseId);

  const isCompleted = isLessonCompleted(lessonId);

  const handleToggleCompletion = () => {
    if (isCompleted) {
      markLessonIncomplete(lessonId);
    } else {
      markLessonCompleted(lessonId);
    }
  };

  return (
    <Button
      onClick={handleToggleCompletion}
      disabled={isLoading}
      variant={isCompleted ? 'default' : 'outline'}
      size="sm"
      className={`flex items-center gap-2 ${className}`}
    >
      {isCompleted ? (
        <>
          <CheckCircle className="h-4 w-4" />
          {showText && 'Completed'}
        </>
      ) : (
        <>
          <Circle className="h-4 w-4" />
          {showText && 'Mark Complete'}
        </>
      )}
    </Button>
  );
};

export const LessonCompletionToggle: React.FC<LessonCompletionProps> = ({
  courseId,
  lessonId,
  className = '',
  showText = false,
}) => {
  const {
    isLessonCompleted,
    markLessonCompleted,
    markLessonIncomplete,
    isLoading,
  } = useCourseCompletion(courseId);

  const isCompleted = isLessonCompleted(lessonId);

  const handleToggleCompletion = () => {
    if (isCompleted) {
      markLessonIncomplete(lessonId);
    } else {
      markLessonCompleted(lessonId);
    }
  };

  return (
    <Button
      onClick={handleToggleCompletion}
      disabled={isLoading}
      variant="ghost"
      size="sm"
      className={`p-2 ${className}`}
    >
      {isCompleted ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <Circle className="h-5 w-5 text-gray-400" />
      )}
    </Button>
  );
};
