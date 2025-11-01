import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

interface CompletionStatus {
  progress: number;
  isCompleted: boolean;
  completedLessons: string[];
  totalLessons: number;
  completedCount: number;
}


export const useCourseCompletion = (courseId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get completion status
  const { data: completionStatus, refetch: refetchCompletion } = useQuery({
    queryKey: [`/api/courses/${courseId}/completion`],
    queryFn: async () => {
      const response = await apiGet(`/api/courses/${courseId}/completion`);
      if (!response.ok) {
        throw new Error('Failed to fetch completion status');
      }
      return response.json() as Promise<CompletionStatus>;
    },
    enabled: !!courseId && !!user,
  });

  // Mark lesson as completed
  const markLessonCompleted = useMutation({
    mutationFn: async (lessonId: string) => {
      const response = await apiPost(`/api/courses/${courseId}/lessons/${lessonId}/complete`);
      if (!response.ok) {
        throw new Error('Failed to mark lesson as completed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Lesson Completed!',
        description: 'Great job! Keep up the good work.',
      });
      
      // Refetch completion status
      refetchCompletion();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/completion`] });
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to mark lesson as completed',
        variant: 'destructive',
      });
    },
  });

  // Mark lesson as incomplete
  const markLessonIncomplete = useMutation({
    mutationFn: async (lessonId: string) => {
      const response = await apiDelete(`/api/courses/${courseId}/lessons/${lessonId}/complete`);
      if (!response.ok) {
        throw new Error('Failed to mark lesson as incomplete');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Lesson Reset',
        description: 'Lesson marked as incomplete.',
      });
      
      // Refetch completion status
      refetchCompletion();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/completion`] });
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to mark lesson as incomplete',
        variant: 'destructive',
      });
    },
  });

  // Complete course
  const completeCourse = useMutation({
    mutationFn: async () => {
      const response = await apiPost(`/api/courses/${courseId}/complete`);
      if (!response.ok) {
        throw new Error('Failed to complete course');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Course Completed!',
        description: 'Congratulations! You have successfully completed this course.',
      });
      
      // Refetch completion status
      refetchCompletion();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/completion`] });
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete course',
        variant: 'destructive',
      });
    },
  });

  // Check if a specific lesson is completed
  const isLessonCompleted = (lessonId: string) => {
    return completionStatus?.completedLessons?.includes(lessonId) || false;
  };

  // Get progress percentage
  const getProgressPercentage = () => {
    return completionStatus?.progress || 0;
  };

  // Check if course is completed
  const isCourseCompleted = () => {
    return completionStatus?.isCompleted || false;
  };

  return {
    completionStatus,
    markLessonCompleted: markLessonCompleted.mutate,
    markLessonIncomplete: markLessonIncomplete.mutate,
    completeCourse: completeCourse.mutate,
    isLessonCompleted,
    getProgressPercentage,
    isCourseCompleted,
    isLoading: markLessonCompleted.isPending || markLessonIncomplete.isPending || completeCourse.isPending,
    refetchCompletion,
  };
};
