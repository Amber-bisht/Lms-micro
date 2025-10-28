import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Upload, Plus, Trash2, Loader2, Video, Youtube, Link as LinkIcon } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

interface Video {
  _id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoType: 'upload' | 'youtube' | 'external-hls';
  hls720Url?: string;
  hls1080Url?: string;
  youtubeUrl?: string;
  externalHlsUrl?: string;
  thumbnail?: string;
  uploadedAt: string;
}

export default function AdminVideosPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
  // YouTube form state
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  
  // External HLS form state
  const [hlsTitle, setHlsTitle] = useState('');
  const [hlsUrl, setHlsUrl] = useState('');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await apiGet('/api/videos');
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: 'Error',
        description: 'Failed to load videos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle) {
      toast({
        title: 'Error',
        description: 'Please provide a title and select a video file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', uploadFile);
      formData.append('title', uploadTitle);

      const response = await apiPost('/api/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: 'Success',
        description: 'Video uploaded successfully. Processing in background.',
      });

      setUploadTitle('');
      setUploadFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('video-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refresh videos list
      await fetchVideos();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to upload video',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleYouTubeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeTitle || !youtubeUrl) {
      toast({
        title: 'Error',
        description: 'Please provide a title and YouTube URL',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await apiPost('/api/videos/youtube', {
        title: youtubeTitle,
        youtubeUrl,
      });

      toast({
        title: 'Success',
        description: 'YouTube video added successfully',
      });

      setYoutubeTitle('');
      setYoutubeUrl('');

      await fetchVideos();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add YouTube video',
        variant: 'destructive',
      });
    }
  };

  const handleExternalHLS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hlsTitle || !hlsUrl) {
      toast({
        title: 'Error',
        description: 'Please provide a title and HLS URL',
        variant: 'destructive',
      });
      return;
    }

    if (!hlsUrl.match(/\.m3u8$/i)) {
      toast({
        title: 'Error',
        description: 'Invalid HLS URL. Must end with .m3u8',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await apiPost('/api/videos/external-hls', {
        title: hlsTitle,
        hlsUrl,
      });

      toast({
        title: 'Success',
        description: 'External HLS video added successfully',
      });

      setHlsTitle('');
      setHlsUrl('');

      await fetchVideos();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add HLS video',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      await apiDelete(`/api/videos/${videoId}`);
      
      toast({
        title: 'Success',
        description: 'Video deleted successfully',
      });

      await fetchVideos();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete video',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || ''}`}>
        {status}
      </span>
    );
  };

  const getVideoTypeIcon = (type: string) => {
    switch (type) {
      case 'youtube':
        return <Youtube className="h-4 w-4" />;
      case 'external-hls':
        return <LinkIcon className="h-4 w-4" />;
      default:
        return <Video className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Video Management</h1>
          <p className="text-muted-foreground mt-2">Upload and manage videos for your courses</p>
        </div>
        <Button onClick={() => setLocation('/admin/dashboard')}>Back to Dashboard</Button>
      </div>

      <Tabs defaultValue="upload" className="mb-8">
        <TabsList>
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload MP4
          </TabsTrigger>
          <TabsTrigger value="youtube">
            <Youtube className="h-4 w-4 mr-2" />
            YouTube Link
          </TabsTrigger>
          <TabsTrigger value="hls">
            <LinkIcon className="h-4 w-4 mr-2" />
            External HLS Link
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Video File</CardTitle>
              <CardDescription>Upload an MP4 file (max 500MB). It will be automatically converted to HLS format.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <Label htmlFor="title">Video Title</Label>
                  <Input
                    id="title"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Enter video title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="video-file">Video File (MP4)</Label>
                  <Input
                    id="video-file"
                    type="file"
                    accept="video/mp4"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">Max size: 500MB</p>
                </div>
                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Video
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="youtube" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Add YouTube Video</CardTitle>
              <CardDescription>Add a YouTube video by providing the URL.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleYouTubeUpload} className="space-y-4">
                <div>
                  <Label htmlFor="youtube-title">Video Title</Label>
                  <Input
                    id="youtube-title"
                    value={youtubeTitle}
                    onChange={(e) => setYoutubeTitle(e.target.value)}
                    placeholder="Enter video title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="youtube-url">YouTube URL</Label>
                  <Input
                    id="youtube-url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
                </div>
                <Button type="submit">
                  <Youtube className="mr-2 h-4 w-4" />
                  Add YouTube Video
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hls" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Add External HLS Link</CardTitle>
              <CardDescription>Add a video with an external HLS URL (e.g., xyz.com/video.m3u8)</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleExternalHLS} className="space-y-4">
                <div>
                  <Label htmlFor="hls-title">Video Title</Label>
                  <Input
                    id="hls-title"
                    value={hlsTitle}
                    onChange={(e) => setHlsTitle(e.target.value)}
                    placeholder="Enter video title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hls-url">HLS URL</Label>
                  <Input
                    id="hls-url"
                    value={hlsUrl}
                    onChange={(e) => setHlsUrl(e.target.value)}
                    placeholder="https://example.com/video.m3u8"
                    required
                  />
                </div>
                <Button type="submit">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Add HLS Video
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Videos List */}
      <Card>
        <CardHeader>
          <CardTitle>All Videos ({videos.length})</CardTitle>
          <CardDescription>Manage your uploaded videos</CardDescription>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No videos yet. Upload your first video above.
            </div>
          ) : (
            <div className="space-y-4">
              {videos.map((video) => (
                <Card key={video._id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-32 h-20 object-cover rounded"
                          />
                        ) : (
                          <div className="w-32 h-20 bg-muted rounded flex items-center justify-center">
                            {getVideoTypeIcon(video.videoType)}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">{video.title}</h3>
                          <p className="text-sm text-muted-foreground">{video.videoType}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {getStatusBadge(video.status)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(video._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

