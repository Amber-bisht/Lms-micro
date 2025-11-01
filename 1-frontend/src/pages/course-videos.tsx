import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link, useParams } from "wouter";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, Copy, Check, PlayCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ThumbsUp, ThumbsDown, MessageCircle, ChevronDown, Star as StarIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { isYouTubeVideo } from "@/lib/youtube-utils";
import { LessonCompletionToggle } from "@/components/lesson-completion";
import { CourseProgress } from "@/components/course-progress";
import { HLSVideoPlayer } from "@/components/HLSVideoPlayer";

// Enhanced Video Player Component - Supports both YouTube and HLS
const EnhancedVideoPlayer = ({ video, onVideoChange, currentIndex, totalVideos }: { 
  video: any; 
  onVideoChange: (index: number) => void; 
  currentIndex: number; 
  totalVideos: number; 
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle iframe load events
  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load video player');
  };

  // Determine video type and URL
  const getVideoInfo = () => {
    const urlToUse = video.currentUrl || video.url;
    
    if (!urlToUse) {
      return { type: 'none', url: null };
    }
    
    // Check if it's a YouTube video
    if (isYouTubeVideo(urlToUse)) {
      const videoId = urlToUse.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1];
      const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0&modestbranding=1`;
      return { type: 'youtube', url: embedUrl };
    }
    
    // Check if it's an HLS video
    if (urlToUse.includes('.m3u8')) {
      // Distinguish between S3 and external HLS
      if (urlToUse.includes('.s3.') || urlToUse.includes('.amazonaws.com')) {
        // S3 HLS - use iframe (served through backend)
        return { type: 's3-hls', url: urlToUse };
      } else {
        // External HLS - use HLS player
        console.log('HLS External video - using URL as-is:', urlToUse);
        return { type: 'hls-external', url: urlToUse };
      }
    }
    
    // Other video types
    return { type: 'other', url: urlToUse };
  };

  const videoInfo = getVideoInfo();

  // No URL available
  if (videoInfo.type === 'none' || !videoInfo.url) {
    return (
      <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl min-h-[400px] flex items-center justify-center">
        <div className="text-center text-white p-8">
          <div className="text-6xl mb-4">📹</div>
          <h3 className="text-xl font-semibold mb-2">No Video Available</h3>
          <p className="text-gray-300 mb-6 max-w-md">This lesson doesn't have a video URL configured yet.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl min-h-[400px] flex items-center justify-center">
        <div className="text-center text-white p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2">Video Player Error</h3>
          <p className="text-gray-300 mb-6 max-w-md">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors mr-3"
            >
              🔄 Reload Page
            </button>
            
            <button
              onClick={() => window.open(video.url, '_blank')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors mr-3"
            >
              🌐 Open in New Tab
            </button>
            
            <button
              onClick={() => onVideoChange(currentIndex + 1)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              ⏭️ Next Video
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render HLS player for external HLS videos
  if (videoInfo.type === 'hls-external') {
    return (
      <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl">
        <div className="relative w-full h-full min-h-[500px]">
          <HLSVideoPlayer
            videoUrl={videoInfo.url}
            controls={true}
            autoplay={false}
            className="w-full h-full min-h-[500px] rounded-xl"
          />
        </div>
      </div>
    );
  }

  // Render iframe for S3 HLS and YouTube videos
  return (
    <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-lg">
              Loading {videoInfo.type === 'youtube' ? 'YouTube' : videoInfo.type === 's3-hls' ? 'S3' : ''} video...
            </p>
          </div>
        </div>
      )}

      {/* Embedded Video Player */}
      <div className="relative w-full h-full min-h-[500px]">
          <iframe
            src={videoInfo.url}
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            className="w-full h-full min-h-[500px] rounded-xl"
            title={video.title || 'Video Player'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
      </div>

      {/* Video Info Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="bg-black bg-opacity-60 backdrop-blur-sm rounded-lg p-3 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{video.title}</h3>
              <p className="text-sm text-gray-300 opacity-90">
                {videoInfo.type === 'youtube' ? 'YouTube Video Player' : 
                 videoInfo.type === 's3-hls' ? 'S3 Video Player' : 'Video Player'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`text-white text-xs px-2 py-1 rounded-full font-medium ${
                videoInfo.type === 'youtube' ? 'bg-red-500' : 
                videoInfo.type === 's3-hls' ? 'bg-orange-500' : 'bg-gray-500'
              }`}>
                {videoInfo.type === 'youtube' ? 'YouTube' : 
                 videoInfo.type === 's3-hls' ? 'S3' : 'Video'}
              </div>
              <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                {currentIndex + 1}/{totalVideos}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-20">
        <button
          onClick={() => onVideoChange(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="bg-black bg-opacity-60 hover:bg-opacity-80 backdrop-blur-sm rounded-full p-3 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-20">
        <button
          onClick={() => onVideoChange(Math.min(totalVideos - 1, currentIndex + 1))}
          disabled={currentIndex === totalVideos - 1}
          className="bg-black bg-opacity-60 hover:bg-opacity-80 backdrop-blur-sm rounded-full p-3 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Fullscreen Button */}
      <div className="absolute bottom-4 right-4 z-20">
        <button
          onClick={() => {
            const iframe = document.querySelector('iframe') as any;
            if (iframe) {
              if (iframe.requestFullscreen) {
                iframe.requestFullscreen();
              } else if (iframe.webkitRequestFullscreen) {
                iframe.webkitRequestFullscreen();
              } else if (iframe.mozRequestFullScreen) {
                iframe.mozRequestFullScreen();
              }
            }
          }}
          className="bg-black bg-opacity-60 hover:bg-opacity-80 backdrop-blur-sm rounded-full p-3 text-white transition-all duration-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function CourseVideosPage() {
  const [_, navigate] = useLocation();
  const { courseSlug } = useParams();
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);

  // Trim courseSlug to handle any trailing spaces that might cause URL encoding issues
  const courseIdentifier = courseSlug?.trim();

  // All hooks must be called at the top level before any conditional returns
  const { data: course, isLoading } = useQuery({
    queryKey: [`/api/courses/${courseIdentifier}`, 'slug'],
    queryFn: async () => {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
      
      if (!API_BASE_URL) throw new Error('API base URL not configured');
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseIdentifier}`);
      const data = await res.json();
      
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
      
      return courseData;
    },
    enabled: !!courseIdentifier,
  });

  // Fetch lessons for this course
  const { data: lessons, isLoading: isLessonsLoading } = useQuery({
    queryKey: [`lessons`, course?._id],
    queryFn: async () => {
      const courseId = course?._id;
      if (!courseId) return [];
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
      if (!API_BASE_URL) throw new Error('API base URL not configured');
      
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/lessons`, {
        credentials: "include",
      });
      if (!res.ok) {
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!course?._id,
  });

  // Fetch reviews for this course
  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: [`/api/courses/${courseIdentifier}/reviews`],
    queryFn: async () => {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
      if (!API_BASE_URL) throw new Error('API base URL not configured');
      try {
        const res = await fetch(`${API_BASE_URL}/api/courses/${courseIdentifier}/reviews`);
        if (!res.ok) {
          return [];
        }
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!courseIdentifier,
  });

  const { user } = useAuth();

  // Fetch user's enrollment status for this course
  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: [`/api/courses/slug/${courseIdentifier}/enrollment`],
    queryFn: async () => {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
      if (!API_BASE_URL) throw new Error('API base URL not configured');
      const res = await fetch(`${API_BASE_URL}/api/courses/slug/${courseIdentifier}/enrollment?userId=${user?._id}`, {
        credentials: "include",
      });
      return res.json();
    },
    enabled: !!courseIdentifier && !!user,
  });
  
  // Add local state for userReview
  const [localUserReview, setLocalUserReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  
  // Pagination state for comments
  const [commentsPage, setCommentsPage] = useState(1);
  const COMMENTS_PAGE_SIZE = 10;
  
  const { data: commentsData = [], refetch: refetchComments, isFetching: isFetchingComments } = useQuery({
    queryKey: [`/courses/${course?._id}/comments`, commentsPage],
    queryFn: async () => {
      const courseId = course?._id;
      if (!courseId) return [];
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
      if (!API_BASE_URL) throw new Error('API base URL not configured');
      const res = await fetch(`${API_BASE_URL}/api/comments/${courseId}?page=${commentsPage}&limit=${COMMENTS_PAGE_SIZE}`, {
        credentials: "include",
      });
      if (!res.ok) {
        return [];
      }
      const data = await res.json();
      // Ensure we return an array
      return Array.isArray(data) ? data : [];
    },
    enabled: !!course?._id,
  });

  const [comment, setComment] = useState("");

  // Build videoLinks from lessons data
  const videoLinks = lessons?.map((lesson: any) => ({
    title: lesson.title,
    url: lesson.playbackUrl || lesson.url || '',
    lessonId: lesson._id,
    order: lesson.order,
    videoId: lesson.videoId,
    type: lesson.video?.videoType || 'youtube',
  })) || course?.videoLinks || [];
  
  const currentVideo = videoLinks[currentVideoIndex];


  // Function to fetch video URL when lesson is clicked
  const fetchVideoUrl = async (lessonId: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
      if (!API_BASE_URL) throw new Error('API base URL not configured');
      
      const apiUrl = `${API_BASE_URL}/api/courses/${courseIdentifier}/${lessonId}`;
      
      const res = await fetch(apiUrl, {
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to fetch video URL');
      }
      
      const data = await res.json();
      
      if (!data.url) {
        return null;
      }
      
      return data.url;
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to load video URL", 
        variant: "destructive" 
      });
      return null;
    }
  };

  // Handle lesson click - fetch and play video
  const handleLessonClick = async (index: number) => {
    setCurrentVideoIndex(index);
    const lesson = videoLinks[index];
    
    // Always fetch the video URL from API to get the latest/actual playback URL
    if (lesson?.lessonId) {
      const videoUrl = await fetchVideoUrl(lesson.lessonId);
      if (videoUrl) {
        setCurrentVideoUrl(videoUrl);
      } else {
        // Fallback to the embedded URL if API call fails
        setCurrentVideoUrl(lesson.url || null);
      }
    } else {
      // Fallback to the embedded URL if no lessonId
      setCurrentVideoUrl(lesson.url || null);
    }
  };

  // Load the first video URL when course data is available
  useEffect(() => {
    if (course && videoLinks.length > 0) {
      const firstLesson = videoLinks[0];
      
      if (firstLesson?.lessonId) {
        fetchVideoUrl(firstLesson.lessonId).then(url => {
          if (url) {
            setCurrentVideoUrl(url);
          } else {
            // Fallback to original URL
            setCurrentVideoUrl(firstLesson.url);
          }
        });
      } else if (firstLesson?.url) {
        setCurrentVideoUrl(firstLesson.url);
      }
    }
  }, [course?._id, videoLinks.length]);

  // Add keyboard shortcuts after course data is available
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (currentVideoIndex > 0) {
            handleLessonClick(currentVideoIndex - 1);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentVideoIndex < videoLinks.length - 1) {
            handleLessonClick(currentVideoIndex + 1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [videoLinks.length, currentVideoIndex]);

  const comments = Array.isArray(commentsData) ? commentsData : [];
  const reviewsArray = Array.isArray(reviews) ? reviews : [];
  const userReview = localUserReview || reviewsArray.find((r: any) => {
    const reviewUserId = r.userId?._id || (r.userId as any)?.id || r.userId;
    const currentUserId = user?._id;

    return reviewUserId === currentUserId;
  });

  const userComments = comments.filter((c: any) => c.user?._id === user?._id);
  const canComment = enrollment?.enrolled && userComments.length < 5;

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
      if (!API_BASE_URL) throw new Error('API base URL not configured');
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseIdentifier}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: user?._id || (user as any)?.id,
          title: `Rating for ${course?.title || 'Course'}`,
          content: `Rated ${rating} out of 5 stars`,
          rating,
        }),
      });
      if (!res.ok) throw await res.json();
      return await res.json();
    },
    onSuccess: (data) => {
      setLocalUserReview(data);
      refetchReviews();
      setRating(0);
      toast({ title: "Thank you!", description: "Your rating has been submitted." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Failed to submit rating", variant: "destructive" });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
      if (!API_BASE_URL) throw new Error('API base URL not configured');
      const courseId = course?._id;
      if (!courseId) throw new Error('Course ID not available');
      const res = await fetch(`${API_BASE_URL}/api/comments/${courseId}`, {
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

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast({
        title: "Copied!",
        description: "Video link copied to clipboard",
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const copyAllVideos = async () => {
    if (!course?.videoLinks) return;
    
    const videoText = course.videoLinks
      .filter((link: any) => link && link.title && link.url)
      .map((link: { title: string; url: string }) => `${link.title}:${link.url}`)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(videoText);
      toast({
        title: "Copied!",
        description: "All video links copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  if (!courseIdentifier) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">No course identifier provided in the URL.</h1>
              <p className="mb-4">Please access this page with a valid course ID or slug, e.g. <code>?id=YOUR_COURSE_ID</code> or <code>?slug=YOUR_COURSE_SLUG</code></p>
              <Button onClick={() => navigate("/")}>Go Home</Button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (isLoading || (user && enrollmentLoading)) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Show loading state
  if (isLoading || isLessonsLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Loading course...</h1>
            </div>
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Course not found</h1>
              <Button onClick={() => navigate("/")}>Go Home</Button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Check if user is enrolled in the course
  if (user && !enrollmentLoading && !enrollment?.enrolled) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Course Access Required</h1>
              <p className="text-muted-foreground mb-6">
                You need to enroll in this course to access the video content.
              </p>
              <div className="space-x-4">
                <Button onClick={() => navigate(`/course/${course.slug?.trim() || course._id}`)}>
                  View Course Details
                </Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Browse Courses
                </Button>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1 py-0">
        {/* Course Progress */}
        {course && (
          <div className="px-6 py-4 bg-background border-b">
            <CourseProgress 
              courseId={course._id} 
              totalLessons={course.videoLinks?.length || 0}
            />
          </div>
        )}
        
        <div className="w-full flex flex-col md:flex-row h-auto md:min-h-[60vh] md:max-h-[80vh]">
          {/* Left: Video Player Full Height/Width */}
          <div className="w-full md:flex-1 bg-black flex flex-col justify-between relative">
            {videoLinks.length > 0 && (
              <>
                <div className="w-full aspect-video mb-4">
                  {currentVideo && (
                      <EnhancedVideoPlayer
                        video={{ ...currentVideo, currentUrl: currentVideoUrl }}
                        onVideoChange={handleLessonClick}
                        currentIndex={currentVideoIndex}
                        totalVideos={videoLinks.length}
                      />
                  )}
                </div>
                <div className="flex justify-between px-6 pb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLessonClick(Math.max(currentVideoIndex - 1, 0))}
                    disabled={currentVideoIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLessonClick(Math.min(currentVideoIndex + 1, videoLinks.length - 1))}
                    disabled={currentVideoIndex === videoLinks.length - 1}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </div>
          {/* Right: Video Titles List */}
          <aside className="w-full md:w-80 bg-card border-l border-border h-auto md:h-full flex flex-col shadow-lg mt-4 md:mt-0 md:max-h-[80vh]">
            <div className="px-6 pt-6 pb-2 border-b border-border">
              <h2 className="text-xl font-bold text-primary mb-2">YouTube Videos</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-4">
              <ul className="space-y-2">
                {videoLinks.map((video: { title: string; url: string; lessonId?: string }, idx: number) => {
                  if (!video || !video.title) return null;
                  
                  return (
                  <li
                    key={video.lessonId || idx}
                    className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors border-l-4 ${
                      idx === currentVideoIndex
                        ? 'bg-primary/90 text-primary-foreground border-primary font-semibold shadow'
                        : 'hover:bg-muted/50 border-transparent'
                    }`}
                    onClick={() => {
                      handleLessonClick(idx);
                    }}
                  >
                    <PlayCircle className={`h-5 w-5 ${idx === currentVideoIndex ? 'text-primary-foreground' : 'text-primary'}`} />
                    <span className="truncate flex-1 text-foreground text-sm md:text-base">{video.title}</span>
                    {course && (
                      <LessonCompletionToggle 
                        courseId={course._id} 
                        lessonId={`lesson-${idx}`}
                        className="ml-auto"
                      />
                    )}
                  </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
        
        {/* Clear separation from video content */}
        <div className="w-full h-24 bg-background"></div>
        
        {/* Rating Section */}
        <div className="w-full bg-background border-t relative z-10 mt-16" style={{ isolation: 'isolate' }}>
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="text-center mb-6 relative z-20">
              <h3 className="text-xl font-bold mb-2">Course Rating</h3>
                
              {/* Show current user's rating if they have one */}
              {user && userReview && (
                <div className="inline-flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 mx-auto">
                  <div className="flex items-center text-green-700 dark:text-green-300">
                    <span className="mr-3 font-medium">Your rating:</span>
                    {[1,2,3,4,5].map(i => (
                      <StarIcon key={i} className={`h-6 w-6 mr-1 ${i <= userReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                    ))}
                    <span className="ml-2 font-semibold">{userReview.rating} / 5</span>
                  </div>
                </div>
              )}
              
              {/* Show rating form for logged in users who haven't rated */}
              {user && !userReview && (
                <div className="max-w-md mx-auto relative z-30">
                  <p className="text-sm text-muted-foreground mb-4 text-center">Rate this course to help other students</p>
                  <div className="flex items-center justify-center mb-4 relative z-40">
                    {[1,2,3,4,5].map(i => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i)}
                        onMouseEnter={() => setHoverRating(i)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none mx-1 transition-transform hover:scale-110 relative z-50"
                        style={{ position: 'relative', zIndex: 9999 }}
                      >
                        <StarIcon className={`h-8 w-8 ${i <= (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                      </button>
                    ))}
                  </div>
                  <div className="text-center mb-4">
                    <span className="text-sm font-medium">{rating > 0 ? `${rating} / 5` : "Click to rate"}</span>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      size="sm"
                      disabled={reviewMutation.isPending || rating === 0}
                      onClick={() => reviewMutation.mutate()}
                      className="px-6 relative z-30"
                    >
                      {reviewMutation.isPending ? "Submitting..." : "Submit Rating"}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Show login prompt for non-logged in users */}
              {!user && (
                <div className="inline-flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mx-auto">
                  <div className="flex items-center text-blue-700 dark:text-blue-300">
                    <div className="flex items-center mr-3">
                      {[1,2,3,4,5].map(i => (
                        <StarIcon key={i} className="h-6 w-6 mr-1 text-muted-foreground" />
                      ))}
                    </div>
                    <span className="font-medium">Please log in to rate this course</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <section className="py-12 border-t bg-muted/30">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{comments.length} Comments</h2>
          </div>
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
      
      <SiteFooter />
    </div>
  );
} 