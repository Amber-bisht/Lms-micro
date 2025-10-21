import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Play, SkipBack, SkipForward, List, Video } from 'lucide-react';
import { 
  isYouTubeVideo, 
  isYouTubePlaylist, 
  convertToYouTubeEmbed,
  fetchYouTubeVideoDetails,
  fetchYouTubePlaylistDetails,
  YouTubeVideo,
  YouTubePlaylist
} from '../lib/youtube-utils';

interface YouTubePlayerProps {
  url: string;
  title?: string;
  className?: string;
  onVideoChange?: (video: YouTubeVideo) => void;
  showPlaylist?: boolean;
}

export function YouTubePlayer({ 
  url, 
  title, 
  className,
  onVideoChange,
  showPlaylist = true 
}: YouTubePlayerProps) {
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null);
  const [playlist, setPlaylist] = useState<YouTubePlaylist | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // YouTube API key (optional - can be set in environment)
  // Note: API calls are handled server-side for security
  const youtubeApiKey = undefined;

  useEffect(() => {
    const processYouTubeUrl = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isYouTubeVideo(url)) {
          // Handle single YouTube video
          const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1];
          if (videoId) {
            const videoDetails = await fetchYouTubeVideoDetails(videoId, youtubeApiKey);
            const video: YouTubeVideo = {
              id: videoId,
              title: videoDetails?.title || `YouTube Video (${videoId})`,
              url: url,
              embedUrl: `https://www.youtube.com/embed/${videoId}`
            };
            setCurrentVideo(video);
            onVideoChange?.(video);
          }
        } else if (isYouTubePlaylist(url)) {
          // Handle YouTube playlist
          const playlistDetails = await fetchYouTubePlaylistDetails(url, youtubeApiKey);
          if (playlistDetails) {
            setPlaylist(playlistDetails);
            if (playlistDetails.videos.length > 0) {
              setCurrentVideo(playlistDetails.videos[0]);
              setCurrentVideoIndex(0);
              onVideoChange?.(playlistDetails.videos[0]);
            }
          }
        } else {
          setError('Invalid YouTube URL');
        }
      } catch (err) {
        setError('Failed to load YouTube content');
        console.error('YouTube player error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (url) {
      processYouTubeUrl();
    }
  }, [url, youtubeApiKey, onVideoChange]);

  const handleVideoChange = (index: number) => {
    if (playlist && playlist.videos[index]) {
      setCurrentVideo(playlist.videos[index]);
      setCurrentVideoIndex(index);
      onVideoChange?.(playlist.videos[index]);
    }
  };

  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      handleVideoChange(currentVideoIndex - 1);
    }
  };

  const handleNext = () => {
    if (playlist && currentVideoIndex < playlist.videos.length - 1) {
      handleVideoChange(currentVideoIndex + 1);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Unable to load video</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentVideo) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No video available</p>
            <p className="text-sm">Please provide a valid YouTube URL</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Show title only on mobile (responsive) or when showPlaylist is true */}
      {showPlaylist && (
        <div className="p-4 border-b bg-card block md:hidden">
          <h3 className="flex items-center gap-2 font-medium text-sm">
            <Video className="h-4 w-4" />
            {title || currentVideo.title}
          </h3>
        </div>
      )}
      
      {/* YouTube Embed */}
      <div className="aspect-video w-full relative">
        <iframe
          src={currentVideo.embedUrl}
          title={currentVideo.title}
          className="w-full h-full border-0 relative"
          style={{ zIndex: 1 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          onError={(e) => {
            console.error('YouTube iframe error:', e);
            setError('Failed to load YouTube video');
          }}
        />
      </div>

      {/* Playlist Navigation */}
      {playlist && playlist.videos.length > 1 && showPlaylist && (
        <div className="p-4 border-t bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <List className="h-4 w-4" />
              <span className="font-medium">Playlist: {playlist.title}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {currentVideoIndex + 1} of {playlist.videos.length}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentVideoIndex === 0}
            >
              <SkipBack className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentVideoIndex === playlist.videos.length - 1}
            >
              Next
              <SkipForward className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Playlist Videos */}
          <div className="max-h-48 overflow-y-auto">
            <div className="space-y-2">
              {playlist.videos.map((video, index) => (
                <div
                  key={video.id}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                    index === currentVideoIndex
                      ? 'bg-primary/10 border-l-4 border-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => handleVideoChange(index)}
                >
                  <Play className={`h-4 w-4 ${
                    index === currentVideoIndex ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <span className={`text-sm truncate ${
                    index === currentVideoIndex ? 'font-medium' : ''
                  }`}>
                    {video.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 