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
import { Course, Lesson, Review } from "@shared/schema";
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
  
  // Use courseSlug as the identifier
  const actualCourseId = courseSlug;
  
  console.log('CourseDetail route parameters:', { courseSlug, actualCourseId });


  const { toast } = useToast();
  const [comment, setComment] = useState("");

  // Course query must come first since other queries depend on it
  const { data: course, isLoading } = useQuery<Course>({
    queryKey: [`/api/courses/${actualCourseId}`, 'slug'],
    queryFn: async () => {
      // Always use slug endpoint since we're using courseSlug
      console.log('Fetching course by slug:', actualCourseId);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
      if (!API_BASE_URL) throw new Error('API base URL not configured');
      const res = await fetch(`${API_BASE_URL}/api/courses/slug/${actualCourseId}`, { credentials: 'include' });
      const data = await res.json();
      console.log('Course data loaded by slug:', data);
      return data;
    },
    enabled: !!actualCourseId,
  });

  // Comments query - depends on course data
  const { data: commentsData = [], refetch: refetchComments, isFetching: isFetchingComments } = useQuery({
    queryKey: [`/courses/${course?._id || actualCourseId}/comments`, commentsPage],
    queryFn: async () => {
      const courseId = course?._id || actualCourseId;
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
      if (!API_BASE_URL) throw new Error('API base URL not configured');
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/comments?page=${commentsPage}&limit=${COMMENTS_PAGE_SIZE}`, {
        credentials: "include",
      });
      return await res.json();
    },
    enabled: !!(course?._id || actualCourseId),
  });
  const comments = commentsData;

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const courseId = course?._id || actualCourseId;
      // Use the standard endpoint - the backend middleware will resolve slug or ID
      const endpoint = `/courses/${course?.slug || courseId}/comments`;
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
      if (!API_BASE_URL) throw new Error('API base URL not configured');
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw await res.json();
      return await res.json();
    },
    onSuccess: () => {
      refetchComments();
      setComment("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.error || "Failed to add comment", variant: "destructive" });
    },
  });
  
  const { data: lessons, isLoading: isLessonsLoading } = useQuery<Lesson[]>({
    queryKey: [`/api/courses/${course?.slug || course?._id || actualCourseId}/lessons`],
    queryFn: async () => {
      const courseId = course?._id || actualCourseId;
      // Use the standard endpoint - the backend middleware will resolve slug or ID
      const endpoint = `/api/courses/${course?.slug || courseId}/lessons`;
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
      if (!API_BASE_URL) throw new Error('API base URL not configured');
      const res = await fetch(`${API_BASE_URL}${endpoint}`, { credentials: 'include' });
      return res.json();
    },
    enabled: !!(course?._id || actualCourseId),
  });
  
  const { data: reviews, isLoading: isReviewsLoading } = useQuery<Review[]>({
    queryKey: [`/api/courses/${course?.slug || course?._id || actualCourseId}/reviews`],
    queryFn: async () => {
      const courseId = course?._id || actualCourseId;
      // Use the standard endpoint - the backend middleware will resolve slug or ID
      const endpoint = `/api/courses/${course?.slug || courseId}/reviews`;
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
      if (!API_BASE_URL) throw new Error('API base URL not configured');
      const res = await fetch(`${API_BASE_URL}${endpoint}`, { credentials: 'include' });
      return res.json();
    },
    enabled: !!(course?._id || actualCourseId),
  });
  
  const { data: enrollment, isLoading: isEnrollmentLoading } = useQuery<{ enrolled: boolean }>({
    queryKey: [`/api/courses/${course?.slug || course?._id || actualCourseId}/enrollment`],
    queryFn: async () => {
      const courseId = course?._id || actualCourseId;
      // Use the standard endpoint - the backend middleware will resolve slug or ID
      const endpoint = `/api/courses/${course?.slug || courseId}/enrollment`;
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
      if (!API_BASE_URL) throw new Error('API base URL not configured');
      const res = await fetch(`${API_BASE_URL}${endpoint}`, { credentials: 'include' });
      return res.json();
    },
    enabled: !!(course?._id || actualCourseId) && !!user,
  });
  
  const enrollMutation = useMutation({
    mutationFn: async () => {
      const courseId = course?._id || actualCourseId;
      // Use the standard endpoint - the backend middleware will resolve slug or ID
      const endpoint = `/api/courses/${course?.slug || courseId}/enroll`;
      
      console.log('Enrollment attempt:', {
        courseId,
        courseSlug: course?.slug,
        actualCourseId,
        endpoint,
        course: course
      });
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
      if (!API_BASE_URL) throw new Error('API base URL not configured');
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        credentials: "include",
      });
      return await res.json();
    },
    onSuccess: () => {
      const courseId = course?._id || actualCourseId;
      // Invalidate queries using the same identifier
      const identifier = course?.slug || courseId;
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${identifier}/enrollment`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/enrollments"] });
    },
    onError: (err: any) => {
      console.error('Enrollment error:', err);
      toast({ title: "Error", description: err?.error || "Failed to enroll in course", variant: "destructive" });
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
          window.location.href = course.enrollmentLink || '';
        }, 1200); // Show notice for 1.2s before redirect
      } catch (error) {
        console.error('Enrollment failed:', error);
        // Still redirect even if enrollment fails
        setShowRedirectNotice(true);
        setTimeout(() => {
          window.location.href = course.enrollmentLink || '';
        }, 1200);
      }
    } else if (course?.enrollmentLink && !user) {
      // If not logged in, just redirect
      window.location.href = course.enrollmentLink || '';
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
      const courseId = course?._id || actualCourseId;
      // Use the standard endpoint - the backend middleware will resolve slug or ID
      const endpoint = `/api/courses/${course?.slug || courseId}/reviews`;
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
      if (!API_BASE_URL) throw new Error('API base URL not configured');
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        
        throw errorData;
      }
      return await res.json();
    },
    onSuccess: (data) => {
      setLocalUserReview(data); // Optimistically set userReview
      const courseId = course?._id || actualCourseId;
      // Invalidate queries using the same identifier
      const identifier = course?.slug || courseId;
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${identifier}/reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${identifier}`] });
      setRating(0);
      toast({ title: "Thank you!", description: "Your rating has been submitted." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.error || "Failed to submit rating", variant: "destructive" });
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
  
  if (!course) {
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
                  The course you're looking for doesn't exist or has been removed.
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
                    {course.duration}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4 mr-1" />
                    {course.lessonCount} lessons
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    Updated {formattedDate}
                  </div>
                  {course.rating && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                      {course.rating} ({course.reviewCount} reviews)
                    </div>
                  )}
                </div>
                <div className="mt-6 flex items-center">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={course.instructorImageUrl || ""} />
                    <AvatarFallback>
                      {course.instructorName ? course.instructorName.charAt(0).toUpperCase() : "I"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="text-sm font-medium">Instructor</p>
                    <p className="text-xs text-muted-foreground">
                      {course.instructorName || "Course Instructor"}
                    </p>
                    {course.postedBy && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Posted by:{" "}
                        <Link 
                          href={`/user/${course.postedBy}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {course.postedBy}
                        </Link>
                      </p>
                    )}
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
                      <p>{course.longDescription || course.description}</p>

                      <h3 className="mt-8">What you'll learn</h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {course.learningObjectives?.map((objective, i) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                            <span>{objective}</span>
                          </li>
                        ))}
                      </ul>

                      <h3 className="mt-8">Requirements</h3>
                      <ul>
                        {course.requirements?.map((requirement, i) => (
                          <li key={i}>{requirement}</li>
                        ))}
                      </ul>

                      <h3 className="mt-8">Who this course is for</h3>
                      <ul>
                        {course.targetAudience?.map((audience, i) => (
                          <li key={i}>{audience}</li>
                        ))}
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
                        src={course.imageUrl} 
                        alt={course.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex flex-col space-y-2">
                        {course.originalPrice && typeof course.originalPrice === 'number' && course.originalPrice > 0 && (
                          <span className="text-lg text-muted-foreground line-through">
                            ₹{course.originalPrice}
                          </span>
                        )}
                        <span className="text-2xl font-bold text-green-600">
                          Free
                        </span>
                      </div>
                      {/* Enrollment logic */}
                      {user ? (
                        enrollment?.enrolled ? (
                          course.enrollmentLink ? (
                            // Show Download button if enrolled and has external link and no video links
                            (!course.videoLinks || course.videoLinks.length === 0) ? (
                              <Button className="w-full mt-4" asChild>
                                <a href={course.enrollmentLink}>
                                  Download
                                </a>
                              </Button>
                            ) : (
                              <Button className="w-full mt-4" asChild>
                                <Link href={course?.slug ? `/course/${course.slug}/learn` : `/course/${course?._id || actualCourseId}/learn`}>
                                  Continue Learning
                                </Link>
                              </Button>
                            )
                          ) : (
                            <Button className="w-full mt-4" asChild>
                              <Link href={`/course/${course.slug}/play`}>
                                <Play className="mr-2 h-4 w-4" />
                                Continue Learning
                              </Link>
                            </Button>
                          )
                        ) : (
                          course.enrollmentLink ? (
                            <>
                              <Button 
                                className="w-full mt-4" 
                                onClick={handleExternalEnroll}
                                disabled={enrollMutation.isPending || isEnrollmentLoading}
                              >
                                {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
                              </Button>
                              {showRedirectNotice && (
                                <div className="mt-2 text-center text-sm text-primary">
                                  Redirecting to external enrollment page...
                                </div>
                              )}
                            </>
                          ) : (
                            <Button 
                              className="w-full mt-4" 
                              onClick={() => enrollMutation.mutate()}
                              disabled={enrollMutation.isPending || isEnrollmentLoading}
                            >
                              {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
                            </Button>
                          )
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
                          {course.rating ? course.rating.toFixed(1) : "0.0"}
                          {typeof course.reviewCount === 'number' && (
                            <> ({course.reviewCount} reviews)</>
                          )}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {course.lessonCount || 0} lessons
                      </div>
                    </div>
                    
                    {course.videoLinks && course.videoLinks.length > 0 && enrollment?.enrolled && (
                      <div className="mt-4">
                        <Button variant="outline" className="w-full" asChild>
                          <Link href={`/course/${course.slug}/play`}>
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
            {/* Remove the Tabs for Syllabus and Reviews and their content */}
            {/* The Accordion for lessons is removed as per the edit hint */}
            {/* The reviews section is removed as per the edit hint */}
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
