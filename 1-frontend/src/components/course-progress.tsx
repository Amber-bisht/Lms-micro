import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, PlayCircle, Trophy } from 'lucide-react';
import { useCourseCompletion } from '@/hooks/use-course-completion';

interface CourseProgressProps {
  courseId: string;
  totalLessons?: number;
  className?: string;
}

export const CourseProgress: React.FC<CourseProgressProps> = ({
  courseId,
  totalLessons = 0,
  className = '',
}) => {
  
  const {
    completionStatus,
    getProgressPercentage,
    isCourseCompleted,
    completeCourse,
    isLoading,
  } = useCourseCompletion(courseId);

  const progress = getProgressPercentage();
  const isCompleted = isCourseCompleted();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <Trophy className="h-5 w-5 text-yellow-500" />
          ) : (
            <PlayCircle className="h-5 w-5 text-blue-500" />
          )}
          <h3 className="font-medium">
            {isCompleted ? 'Course Completed!' : 'Course Progress'}
          </h3>
        </div>
        <Badge variant={isCompleted ? 'default' : 'secondary'}>
          {progress}%
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {completionStatus?.completedCount || 0} of {totalLessons} lessons completed
          </span>
          <span>{progress}% complete</span>
        </div>
      </div>

      {/* Completion Actions */}
      {!isCompleted && progress > 0 && (
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              completeCourse();
            }}
            disabled={isLoading}
            size="sm"
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Mark as Complete
          </Button>
        </div>
      )}

      {/* Course Completion Display */}
      {isCompleted && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <div>
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Course Completed!
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Congratulations! You've successfully completed this course.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
