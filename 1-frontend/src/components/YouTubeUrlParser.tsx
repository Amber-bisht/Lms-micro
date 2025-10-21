import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Youtube, Loader2, Play, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface YouTubeUrlParserProps {
  onVideosParsed: (videos: { title: string; url: string }[]) => void;
  className?: string;
}

export function YouTubeUrlParser({ onVideosParsed, className }: YouTubeUrlParserProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleParseYouTubeUrl = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/youtube/parse', { url });
      
      if (!response.ok) {
        throw new Error('Failed to parse YouTube URL');
      }

      const data = await response.json();
      
      if (data.type === 'video') {
        // Single video
        onVideosParsed([{
          title: data.title,
          url: url
        }]);
        
        toast({
          title: "YouTube Video Added",
          description: `Added: ${data.title}`,
        });
      } else if (data.type === 'playlist') {
        // Fetch playlist videos
        const playlistResponse = await apiRequest('GET', `/api/youtube/playlist/${data.id}`);
        
        if (playlistResponse.ok) {
          const playlistData = await playlistResponse.json();
          
          if (playlistData.videos && playlistData.videos.length > 0) {
            const videos = playlistData.videos.map((video: any) => ({
              title: video.title,
              url: video.url
            }));
            
            onVideosParsed(videos);
            
            toast({
              title: "YouTube Playlist Added",
              description: `Added ${videos.length} videos from: ${playlistData.title}`,
            });
          } else {
            // If no videos found, add the playlist URL itself
            onVideosParsed([{
              title: data.title,
              url: url
            }]);
            
            toast({
              title: "YouTube Playlist Added",
              description: `Added: ${data.title}`,
            });
          }
        } else {
          // Fallback to adding the playlist URL
          onVideosParsed([{
            title: data.title,
            url: url
          }]);
          
          toast({
            title: "YouTube Playlist Added",
            description: `Added: ${data.title}`,
          });
        }
      }
    } catch (error) {
      console.error('Error parsing YouTube URL:', error);
      toast({
        title: "Error",
        description: "Failed to parse YouTube URL. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setUrl('');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Youtube className="h-5 w-5 text-red-500" />
        <Label className="text-base font-medium">YouTube URL Parser</Label>
      </div>
      
      <div className="flex gap-2">
        <Input
          placeholder="Enter YouTube video or playlist URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={handleParseYouTubeUrl}
          disabled={isLoading || !url.trim()}
          size="sm"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Play className="h-4 w-4 mr-1" />
              Parse
            </>
          )}
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground">
        <p>Supports:</p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>YouTube video URLs (youtube.com/watch?v=...)</li>
          <li>YouTube playlist URLs (youtube.com/playlist?list=...)</li>
          <li>Short URLs (youtu.be/...)</li>
        </ul>
      </div>
    </div>
  );
} 