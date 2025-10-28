import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  Calendar,
  User,
  Clock,
  Star,
  Play,
  Video,
  Youtube,
  Link,
  Upload
} from 'lucide-react';
import { 
  getAllCourses, 
  createCourse, 
  updateCourse, 
  deleteCourse,
  getLessonsByCourse,
  createLesson,
  updateLesson,
  deleteLesson,
  getAllVideos
} from '@/lib/admin-api';
import { useToast } from '@/hooks/use-toast';

interface Course {
  _id: string;
  title: string;
  description: string;
  slug: string;
  instructorId: string;
  lessonCount: number;
  rating: number;
  thumbnail?: string;
  videoLinks?: Array<{
    title: string;
    url: string;
    type: string;
  }>;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CourseFormData {
  title: string;
  description: string;
  slug: string;
  thumbnail: string;
  isPublished: boolean;
}

interface Video {
  _id: string;
  userId: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoType: 'upload' | 'youtube' | 'external-hls';
  youtubeUrl?: string;
  externalHlsUrl?: string;
  hls720Url?: string;
  hls1080Url?: string;
  duration?: number;
  thumbnail?: string;
  uploadedAt: string;
}

interface Lesson {
  _id: string;
  title: string;
  description: string;
  content: string;
  videoId?: string;
  courseId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface LessonFormData {
  title: string;
  description: string;
  content: string;
  videoId: string;
  order: number;
}

export default function AdminCoursesWithVideoIntegration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    slug: '',
    thumbnail: '',
    isPublished: false,
  });

  // Video and lesson management state
  const [videos, setVideos] = useState<Video[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonFormData, setLessonFormData] = useState<LessonFormData>({
    title: '',
    description: '',
    content: '',
    videoId: '',
    order: 1,
  });

  useEffect(() => {
    fetchCourses();
    fetchVideos();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await getAllCourses();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async () => {
    try {
      const data = await getAllVideos();
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: 'Error',
        description: 'Failed to load videos',
        variant: 'destructive',
      });
    }
  };

  const handleCreateCourse = async () => {
    try {
      if (!formData.title || !formData.description || !formData.slug) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      await createCourse({ ...formData, instructorId: 'admin' });
      toast({
        title: 'Success',
        description: 'Course created successfully',
      });
      setIsCreateDialogOpen(false);
      resetForm();
      fetchCourses();
    } catch (error: any) {
      console.error('Error creating course:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create course',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateCourse = async () => {
    try {
      if (!editingCourse) return;

      if (!formData.title || !formData.description || !formData.slug) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      await updateCourse(editingCourse._id, { ...formData, instructorId: editingCourse.instructorId });
      toast({
        title: 'Success',
        description: 'Course updated successfully',
      });
      setIsEditDialogOpen(false);
      setEditingCourse(null);
      resetForm();
      fetchCourses();
    } catch (error: any) {
      console.error('Error updating course:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update course',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await deleteCourse(courseId);
      toast({
        title: 'Success',
        description: 'Course deleted successfully',
      });
      fetchCourses();
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete course',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      slug: '',
      thumbnail: '',
      isPublished: false,
    });
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      slug: course.slug,
      thumbnail: course.thumbnail || '',
      isPublished: course.isPublished,
    });
    setIsEditDialogOpen(true);
    // Load lessons for this course
    fetchLessons(course._id);
  };

  // ==================== LESSON MANAGEMENT FUNCTIONS ====================

  const fetchLessons = async (courseId: string) => {
    try {
      const data = await getLessonsByCourse(courseId);
      setLessons(data);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lessons',
        variant: 'destructive',
      });
    }
  };

  const handleCreateLesson = async () => {
    try {
      if (!editingCourse) return;

      if (!lessonFormData.videoId) {
        toast({
          title: 'Error',
          description: 'Please select a video for this lesson',
          variant: 'destructive',
        });
        return;
      }

      await createLesson(editingCourse._id, lessonFormData);
      toast({
        title: 'Success',
        description: 'Lesson created successfully',
      });
      setIsLessonDialogOpen(false);
      resetLessonForm();
      fetchLessons(editingCourse._id);
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create lesson',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateLesson = async () => {
    try {
      if (!editingLesson) return;

      if (!lessonFormData.videoId) {
        toast({
          title: 'Error',
          description: 'Please select a video for this lesson',
          variant: 'destructive',
        });
        return;
      }

      await updateLesson(editingLesson._id, lessonFormData);
      toast({
        title: 'Success',
        description: 'Lesson updated successfully',
      });
      setIsLessonDialogOpen(false);
      setEditingLesson(null);
      resetLessonForm();
      if (editingCourse) {
        fetchLessons(editingCourse._id);
      }
    } catch (error: any) {
      console.error('Error updating lesson:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update lesson',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      await deleteLesson(lessonId);
      toast({
        title: 'Success',
        description: 'Lesson deleted successfully',
      });
      if (editingCourse) {
        fetchLessons(editingCourse._id);
      }
    } catch (error: any) {
      console.error('Error deleting lesson:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete lesson',
        variant: 'destructive',
      });
    }
  };

  const resetLessonForm = () => {
    setLessonFormData({
      title: '',
      description: '',
      content: '',
      videoId: '',
      order: lessons.length + 1,
    });
  };

  const openLessonDialog = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      setLessonFormData({
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        videoId: lesson.videoId || '',
        order: lesson.order,
      });
    } else {
      setEditingLesson(null);
      resetLessonForm();
    }
    setIsLessonDialogOpen(true);
  };

  const getVideoIcon = (videoType: string) => {
    switch (videoType) {
      case 'youtube':
        return <Youtube className="h-4 w-4 text-red-600" />;
      case 'external-hls':
        return <Link className="h-4 w-4 text-blue-600" />;
      case 'upload':
        return <Upload className="h-4 w-4 text-green-600" />;
      default:
        return <Video className="h-4 w-4" />;
    }
  };

  const getVideoStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-blue-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Course Management</h1>
          <p className="text-muted-foreground mt-2">Manage your courses and tag videos as lessons</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation('/admin/dashboard')}>
            <BookOpen className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new course
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Course title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Course description"
                    rows={4}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="course-slug"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="thumbnail">Thumbnail URL</Label>
                  <Input
                    id="thumbnail"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublished"
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                  />
                  <Label htmlFor="isPublished">Published</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCourse}>Create Course</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {course.description.length > 100 
                      ? `${course.description.substring(0, 100)}...` 
                      : course.description
                    }
                  </CardDescription>
                </div>
                <Badge variant={course.isPublished ? "default" : "secondary"}>
                  {course.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="h-4 w-4 mr-2" />
                  <span>Instructor: {course.instructorId}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4 mr-2" />
                  <span>{course.lessonCount} lessons</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Created: {formatDate(course.createdAt)}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Star className="h-4 w-4 mr-2" />
                  <span>Rating: {course.rating}/5</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(course)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the course
                          "{course.title}" and all its lessons.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteCourse(course._id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No courses found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first course to get started'}
          </p>
        </div>
      )}

      {/* Edit Dialog with Video Integration */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Course & Manage Lessons</DialogTitle>
            <DialogDescription>
              Update the course details and tag videos as lessons
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6">
            {/* Course Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Course Details</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Course title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description *</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Course description"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-slug">Slug *</Label>
                  <Input
                    id="edit-slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="course-slug"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-thumbnail">Thumbnail URL</Label>
                  <Input
                    id="edit-thumbnail"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-isPublished"
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                  />
                  <Label htmlFor="edit-isPublished">Published</Label>
                </div>
              </div>
            </div>

            {/* Lessons Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Lessons ({lessons.length})</h3>
                <Button onClick={() => openLessonDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tag Video as Lesson
                </Button>
              </div>
              
              <div className="space-y-3">
                {lessons.map((lesson) => {
                  const video = videos.find(v => v._id === lesson.videoId);
                  return (
                    <Card key={lesson._id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">#{lesson.order}</Badge>
                              <h4 className="font-medium">{lesson.title}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {lesson.description}
                            </p>
                            {video && (
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  {getVideoIcon(video.videoType)}
                                  <span className="capitalize">{video.videoType}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(video.duration)}
                                </div>
                                <div className={`flex items-center gap-1 ${getVideoStatusColor(video.status)}`}>
                                  <div className="w-2 h-2 rounded-full bg-current"></div>
                                  <span className="capitalize">{video.status}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openLessonDialog(lesson)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{lesson.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteLesson(lesson._id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {lessons.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No lessons yet. Tag videos from the uploader service as lessons.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCourse}>Update Course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog with Video Selection */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? 'Edit Lesson' : 'Tag Video as Lesson'}
            </DialogTitle>
            <DialogDescription>
              {editingLesson ? 'Update the lesson details' : 'Select a video - title, description, and content will be auto-filled'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6">
            {/* Video Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Video</h3>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {videos.filter(v => v.status === 'completed').map((video) => (
                  <Card 
                    key={video._id} 
                    className={`cursor-pointer transition-colors ${
                      lessonFormData.videoId === video._id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setLessonFormData({ 
                        ...lessonFormData, 
                        videoId: video._id,
                        title: video.title,
                        description: `Video lesson: ${video.title}`,
                        content: `This lesson covers: ${video.title}`
                      });
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getVideoIcon(video.videoType)}
                          <div>
                            <h4 className="font-medium text-sm">{video.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{formatDuration(video.duration)}</span>
                              <span>•</span>
                              <span className="capitalize">{video.videoType}</span>
                              <span>•</span>
                              <span>{formatDate(video.uploadedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`text-xs ${getVideoStatusColor(video.status)}`}>
                          {video.status}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Lesson Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Lesson Details</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="lesson-title">Title (auto-filled from video)</Label>
                  <Input
                    id="lesson-title"
                    value={lessonFormData.title}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                    placeholder="Lesson title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lesson-description">Description (auto-filled from video)</Label>
                  <Textarea
                    id="lesson-description"
                    value={lessonFormData.description}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, description: e.target.value })}
                    placeholder="Lesson description"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lesson-content">Content (auto-filled from video)</Label>
                  <Textarea
                    id="lesson-content"
                    value={lessonFormData.content}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, content: e.target.value })}
                    placeholder="Lesson content or notes"
                    rows={4}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lesson-order">Order *</Label>
                  <Input
                    id="lesson-order"
                    type="number"
                    value={lessonFormData.order}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, order: parseInt(e.target.value) || 1 })}
                    placeholder="1"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLessonDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editingLesson ? handleUpdateLesson : handleCreateLesson}>
              {editingLesson ? 'Update Lesson' : 'Create Lesson'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
