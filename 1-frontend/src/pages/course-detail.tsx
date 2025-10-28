import React from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Course, Lesson, Review } from "@/schema";
import { apiGet, apiPost } from "@/lib/api";
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Calendar, 
  Star, 
  CheckCircle, 
  ChevronDown, 
  Play, 
  UserCircle,
  AlertTriangle,
  ThumbsUp, ThumbsDown, MessageCircle, Star as StarIcon
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";


export default function CourseDetail() {
  const { courseSlug } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showRedirectNotice, setShowRedirectNotice] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const COMMENTS_PAGE_SIZE = 10;
  
  // Trim courseSlug to handle any trailing spaces that might cause URL encoding issues
  const actualCourseId = courseSlug?.trim();
  
  console.log('CourseDetail route parameters:', { courseSlug, actualCourseId });


  const { toast } = useToast();
  const [comment, setComment] = useState("");

  // Course query must come first since other queries depend on it
  const { data: course, isLoading, error } = useQuery<Course>({
    queryKey: [`course`, actualCourseId],
    queryFn: async () => {
      console.log('Fetching course by slug:', actualCourseId);
      const response = await apiGet(`/api/courses/${actualCourseId}`);
      const data = await response.json();
      console.log('Raw API response:', data);
      
      // Handle case where API returns an array instead of single object
      let courseData;
      if (Array.isArray(data)) {
        if (data.length === 0) {
          throw new Error('Course not found');
        }
        courseData = data[0]; // Return first course from array
      } else {
        courseData = data;
      }
      
      console.log('Processed course data:', courseData);
      console.log('Course _id:', courseData._id);
      console.log('Course slug:', courseData.slug);
      return courseData;
    },
    enabled: !!actualCourseId,
    retry: 3,
    retryDelay: 1000,
  });

  // Comments query - depends on course data
  const { data: commentsData = [], refetch: refetchComments, isFetching: isFetchingComments } = useQuery({
    queryKey: [`comments`, course?._id, commentsPage],
    queryFn: async () => {
      const courseId = course?._id;
      if (!courseId) return [];
      
      console.log('Fetching comments for course:', courseId);
      const response = await apiGet(`/api/comments/${courseId}?page=${commentsPage}&limit=${COMMENTS_PAGE_SIZE}`);
      const data = await response.json();
      console.log('Comments data:', data);
      return data;
    },
    enabled: !!course?._id,
  });
  const comments = commentsData;

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const courseId = course?._id;
      const userId = user?._id || user?.id;
      if (!courseId) throw new Error('Course ID not available');
      
      console.log('Adding comment for course:', courseId, 'content:', content);
      const response = await apiPost(`/api/comments/${courseId}`, {
        content,
        userId: userId,
        username: user?.username,
      });
      const data = await response.json();
      console.log('Add comment response:', data);
      return data;
    },
    onSuccess: () => {
      refetchComments();
      setComment("");
      toast({ title: "Success", description: "Comment added successfully" });
    },
    onError: (err: any) => {
      console.error('Add comment error:', err);
      toast({ title: "Error", description: err?.error || "Failed to add comment", variant: "destructive" });
    },
  });
  
  const { data: lessons, isLoading: isLessonsLoading } = useQuery<Lesson[]>({
    queryKey: [`lessons`, course?._id],
    queryFn: async () => {
      const courseId = course?._id;
      if (!courseId) return [];
      
      console.log('Fetching lessons for course:', courseId);
      const response = await apiGet(`/api/courses/${courseId}/lessons`);
      const data = await response.json();
      console.log('Lessons data:', data);
      return data;
    },
    enabled: !!course?._id,
    retry: 3,
    retryDelay: 1000,
  });
  
  const { data: reviews = [], isLoading: isReviewsLoading } = useQuery<Review[]>({
    queryKey: [`reviews`, course?._id],
    queryFn: async () => {
      // Reviews functionality temporarily disabled
      // TODO: Add proper reviews route to API gateway
      return [];
    },
    enabled: false, // Disabled until API gateway is updated
  });
  
  const { data: enrollment, isLoading: isEnrollmentLoading } = useQuery<{ enrolled: boolean }>({
    queryKey: [`enrollment`, course?.slug, user?._id],
    queryFn: async () => {
      const courseSlug = course?.slug;
      const userId = user?._id || user?.id;
      if (!courseSlug || !userId) return { enrolled: false };
      
      console.log('Checking enrollment for course slug:', courseSlug, 'user:', userId);
      const response = await apiGet(`/api/courses/slug/${courseSlug}/enrollment?userId=${userId}`);
      const data = await response.json();
      console.log('Enrollment status:', data);
      return data;
    },
    enabled: !!(course?.slug && (user?._id || user?.id)),
    retry: 3,
    retryDelay: 1000,
  });
  
  const enrollMutation = useMutation({
    mutationFn: async () => {
      const courseSlug = course?.slug;
      const userId = user?._id || user?.id;
      if (!courseSlug || !userId) {
        console.error('Enrollment error - Missing data:', { 
          courseSlug, 
          userId, 
          user: user,
          course: course 
        });
        throw new Error('Course slug or user ID not available');
      }
      
      console.log('Attempting enrollment for course slug:', courseSlug, 'user:', userId);
      const response = await apiPost(`/api/courses/slug/${courseSlug}/enroll`, {
        userId: userId,
        email: user.email,
        username: user.username,
      });
      const data = await response.json();
      console.log('Enrollment response:', data);
      return data;
    },
    onSuccess: () => {
      // Invalidate enrollment query
      queryClient.invalidateQueries({ queryKey: [`enrollment`, course?.slug, user?._id] });
      toast({ title: "Success", description: "Successfully enrolled in course!" });
    },
    onError: (err: any) => {
      console.error('Enrollment error:', err);
      toast({ title: "Error", description: err?.message || "Failed to enroll in course", variant: "destructive" });
    },
  });
  
  // Handler for external enrollment link
  const handleExternalEnroll = async () => {
    if (course?.enrollmentLink && user) {
      try {
        // First enroll the user in the course
        await enrollMutation.mutateAsync();
        
        // Then show redirect notice and redirect
        setShowRedirectNotice(true);
        setTimeout(() => {
          // Enrollment link not available
        }, 1200); // Show notice for 1.2s before redirect
      } catch (error) {
        console.error('Enrollment failed:', error);
        // Still redirect even if enrollment fails
        setShowRedirectNotice(true);
        setTimeout(() => {
          // Enrollment link not available
        }, 1200);
      }
    }
  };


  
  // Now, after all hooks and queries, use enrollment
  const userComments = comments.filter((c: any) => c.user?._id === user?._id);
  const canComment = enrollment?.enrolled && userComments.length < 5;
  
  // Add local state for userReview
  const [localUserReview, setLocalUserReview] = useState(null);
  const userReview = localUserReview || reviews?.find((r: any) => {
    const userId = typeof r.userId === 'string' ? r.userId : r.userId?._id;
    return userId === user?._id;
  });
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const reviewMutation = useMutation({
    mutationFn: async () => {
      const courseId = course?._id;
      const userId = user?._id || user?.id;
      if (!courseId || !userId) throw new Error('Course ID or user ID not available');
      
      console.log('Submitting rating for course:', courseId, 'rating:', rating);
      const response = await apiPost(`/api/reviews`, {
        courseId,
        userId: userId,
        rating,
        comment: `Rated ${rating} out of 5 stars`,
      });
      const data = await response.json();
      console.log('Rating response:', data);
      return data;
    },
    onSuccess: (data) => {
      setLocalUserReview(data); // Optimistically set userReview
      const courseId = course?._id;
      // Invalidate queries using the same identifier
      queryClient.invalidateQueries({ queryKey: [`reviews`, courseId] });
      queryClient.invalidateQueries({ queryKey: [`course`, courseId] });
      setRating(0);
      toast({ title: "Thank you!", description: "Your rating has been submitted." });
    },
    onError: (err: any) => {
      console.error('Rating error:', err);
      toast({ title: "Error", description: err?.message || "Failed to submit rating", variant: "destructive" });
    },
  });
  
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <p className="ml-3 text-lg">Loading course...</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading course...</p>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="text-center py-12">
              <CardHeader>
                <div className="mx-auto">
                  <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
                </div>
                <CardTitle className="mt-4">Course Not Found</CardTitle>
                <CardDescription>
                  {error ? `Error: ${error.message}` : "The course you're looking for doesn't exist or has been removed."}
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center">
                <Button asChild>
                  <Link href="/">Browse Courses</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }
  
  const formattedDate = course.createdAt 
    ? new Date(course.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) 
    : "N/A";
  
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Course Hero */}
        <section className="bg-muted/30 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-2/3 md:pr-8">
                <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to courses
                </Link>

                {/* Move title, description, stats, instructor to top */}
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  {course.title}
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  {course.description}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {course.duration || `${course.lessonCount} lessons`}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4 mr-1" />
                    {course.rating || 0}★ rating
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    Updated {formattedDate}
                  </div>
                  {course.rating && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                      {course.rating} ({course.reviewCount || 0} reviews)
                    </div>
                  )}
                </div>
                <div className="mt-6 flex items-center">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      I
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="text-sm font-medium">Instructor</p>
                    <p className="text-xs text-muted-foreground">
                      Course Instructor
                    </p>
                  </div>
                </div>

                {/* Course Overview moved below */}
                <Card className="mb-8 mt-8">
                  <CardHeader>
                    <CardTitle>Course Overview</CardTitle>
                    <CardDescription>
                      What you'll learn in this course
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose dark:prose-invert max-w-none">
                      <h3>Description</h3>
                      <p>{course.description}</p>

                      <h3 className="mt-8">What you'll learn</h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {course.learningObjectives && course.learningObjectives.length > 0 ? (
                          course.learningObjectives.map((objective, i) => (
                            <li key={i} className="flex items-start">
                              <CheckCircle className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                              <span>{objective}</span>
                            </li>
                          ))
                        ) : (
                          <li className="flex items-start">
                            <CheckCircle className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                            <span>Master the fundamentals of {course.title}</span>
                          </li>
                        )}
                      </ul>

                      <h3 className="mt-8">Requirements</h3>
                      <ul>
                        {course.requirements && course.requirements.length > 0 ? (
                          course.requirements.map((requirement, i) => (
                            <li key={i}>{requirement}</li>
                          ))
                        ) : (
                          <li>Basic computer skills</li>
                        )}
                      </ul>

                      <h3 className="mt-8">Who this course is for</h3>
                      <ul>
                        {course.targetAudience && course.targetAudience.length > 0 ? (
                          course.targetAudience.map((audience, i) => (
                            <li key={i}>{audience}</li>
                          ))
                        ) : (
                          <li>Anyone interested in learning {course.title}</li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:w-1/3 mt-8 md:mt-0">
                <Card>
                  <CardContent className="p-6">
                    <div className="aspect-video w-full overflow-hidden rounded-lg mb-6">
                      <img 
                        src={course.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDIyNVYxNzVIMTc1VjEyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4NSAxMzVMMjAwIDE1MEwyMTUgMTM1TDIwMCAxMjBMMTg1IDEzNVoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+'} 
                        alt={course.title || 'Course thumbnail'} 
                        className="w-full h-full object-cover"
                        onLoad={() => console.log('Image loaded successfully:', course.thumbnail)}
                        onError={(e) => {
                          console.error('Image failed to load:', course.thumbnail);
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDIyNVYxNzVIMTc1VjEyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4NSAxMzVMMjAwIDE1MEwyMTUgMTM1TDIwMCAxMjBMMTg1IDEzNVoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+';
                        }}
                      />
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex flex-col space-y-2">
                        <span className="text-2xl font-bold text-green-600">
                          Free
                        </span>
                      </div>
                      {/* Enrollment logic */}
                      {user ? (
                        enrollment?.enrolled ? (
                          <Button className="w-full mt-4" asChild>
                            <Link href={`/course/${course.slug?.trim()}/learn`}>
                              Continue Learning
                            </Link>
                          </Button>
                        ) : (
                          <Button 
                            className="w-full mt-4" 
                            onClick={() => enrollMutation.mutate()}
                            disabled={enrollMutation.isPending || isEnrollmentLoading}
                          >
                            {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
                          </Button>
                        )
                      ) : (
                        <Button className="w-full mt-4" asChild>
                          <Link href="/auth">
                            Log in to Enroll
                          </Link>
                        </Button>
                      )}
                    </div>
                    
                    {/* New: Show rating and lesson count */}
                    <div className="mt-6 flex flex-col items-center">
                      <div className="flex items-center mb-2">
                        {Array(5).fill(0).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${i < (course.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-muted"}`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-muted-foreground">
                          {course.rating ? course.rating.toFixed(1) : "0.0"} ({course.reviewCount || 0} reviews)
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {course.lessonCount || 0} lessons
                      </div>
                    </div>
                    
                    {course.videoLinks && course.videoLinks.length > 0 && enrollment?.enrolled && (
                      <div className="mt-4">
                        <Button variant="outline" className="w-full" asChild>
                          <Link href={`/course/${course.slug?.trim()}/play`}>
                            <Play className="mr-2 h-4 w-4" />
                            View Video Links ({course.videoLinks.length})
                          </Link>
                        </Button>
                      </div>
                    )}
                    
                    <Separator className="my-6" />
                    
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
        
        {/* Course Content */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8">Course Content</h2>
            
            {isLessonsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Loading lessons...</p>
              </div>
            ) : lessons && lessons.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {lessons.map((lesson, index) => (
                  <AccordionItem key={lesson._id || index} value={`lesson-${index}`}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold">{lesson.title}</h3>
                          <p className="text-sm text-muted-foreground">{lesson.description}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-11">
                        {lesson.content && (
                          <div className="prose dark:prose-invert max-w-none mb-4">
                            <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                          </div>
                        )}
                        {lesson.videoUrl && (
                          <div className="mb-4">
                            <video controls className="w-full max-w-2xl rounded-lg">
                              <source src={lesson.videoUrl} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        )}
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{lesson.duration || 'Duration not specified'}</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300">No lessons available for this course yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Comments Section */}
        <section className="py-12 border-t">
          <div className="max-w-2xl mx-auto px-4">
            {/* Add a review/rating - available for all logged-in users */}
            {user && !userReview && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-2">Rate this course</h3>
                <div className="flex items-center mb-2">
                  {[1,2,3,4,5].map(i => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(i)}
                      onMouseEnter={() => setHoverRating(i)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none"
                    >
                      <StarIcon className={`h-7 w-7 ${i <= (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted'}`} />
                    </button>
                  ))}
                  <span className="ml-2 text-sm">{rating > 0 ? `${rating} / 5` : "Select rating"}</span>
                </div>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    disabled={reviewMutation.isPending || rating === 0}
                    onClick={() => reviewMutation.mutate()}
                  >
                    {reviewMutation.isPending ? "Submitting..." : "Submit Rating"}
                  </Button>
                </div>
              </div>
            )}
            {user && userReview && (
              <div className="mb-8 flex items-center text-green-700">
                <span className="mr-2">You rated this course:</span>
                {[1,2,3,4,5].map(i => (
                  <StarIcon key={i} className={`h-6 w-6 ${i <= userReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted'}`} />
                ))}
                <span className="ml-2">{userReview.rating} / 5</span>
              </div>
            )}

            {/* Add a comment */}
            {user && (
              <div className="flex items-start gap-3 mb-8">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback>{user.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (!comment.trim()) return;
                    addCommentMutation.mutate(comment.trim());
                  }}
                  className="flex-1"
                >
                  <Textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    minLength={2}
                    maxLength={500}
                    disabled={addCommentMutation.isPending}
                    className="resize-none min-h-[48px]"
                  />
                  <div className="flex justify-end mt-2">
                    <Button type="submit" size="sm" disabled={addCommentMutation.isPending || !comment.trim()}>
                      {addCommentMutation.isPending ? "Posting..." : "Comment"}
                    </Button>
                  </div>
                </form>
              </div>
            )}
            {/* Comments list */}
            <ul className="space-y-0 mb-8">
              {comments.map((c: any, idx: number) => (
                <li key={c._id || Math.random()} className="py-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={c.user?.avatar} alt={c.user?.username} />
                      <AvatarFallback>{c.user?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/user/${c.user?.username || "User"}`}
                          className="font-semibold text-base text-primary hover:text-primary/80 hover:underline cursor-pointer"
                        >
                          @{c.user?.username || "User"}
                        </Link>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                      </div>
                      <div className="text-base leading-relaxed whitespace-pre-line mb-2">{c.content}</div>
                    </div>
                  </div>
                  {idx < comments.length - 1 && <Separator className="my-4" />}
                </li>
              ))}
            </ul>
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setCommentsPage(p => p + 1)}
                disabled={isFetchingComments || comments.length < COMMENTS_PAGE_SIZE}
              >
                {isFetchingComments ? "Loading..." : "Load more"}
              </Button>
            </div>
            {!user && <div className="text-muted-foreground mt-8">You must be logged in to comment.</div>}
          </div>
        </section>
      </main>
      
      <SiteFooter />
    </div>
  );
}
