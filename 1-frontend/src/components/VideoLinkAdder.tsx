import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  X, 
  Youtube,
  Play,
  List
} from 'lucide-react';
import { processYouTubePlaylist, parseCustomFormat } from '@/lib/youtube-utils';

interface VideoLink {
  title: string;
  url: string;
  type: 'youtube';
}

interface VideoLinkAdderProps {
  links: VideoLink[];
  onLinksChange: (links: VideoLink[]) => void;
  disabled?: boolean;
}

export function VideoLinkAdder({ links, onLinksChange, disabled = false }: VideoLinkAdderProps) {
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [activeTab, setActiveTab] = useState('single');

  const addLink = () => {
    if (!currentTitle.trim() || !currentUrl.trim()) {
      alert('Please enter both title and URL for the video link.');
      return;
    }

    const newLink: VideoLink = {
      title: currentTitle.trim(),
      url: currentUrl.trim(),
      type: 'youtube'
    };

    // Validate the link before adding
    if (!newLink.title || !newLink.url) {
      console.warn('Invalid video link data:', newLink);
      alert('Invalid video link data. Please check your input.');
      return;
    }
    
    // Additional validation
    if (newLink.title === 'undefined' || newLink.url === 'undefined') {
      alert('Invalid video link data. Please check your input.');
      return;
    }
    
    console.log('Adding new video link:', newLink);
    onLinksChange([...links, newLink]);
    setCurrentTitle('');
    setCurrentUrl('');
    
    // Show success message
    alert(`Successfully added video link: ${newLink.title}`);
  };

  const addBulkLinks = () => {
    if (!bulkInput.trim()) {
      alert('Please enter video links in the bulk input field.');
      return;
    }

    const lines = bulkInput.trim().split('\n').filter(line => line.trim());
    const newLinks: VideoLink[] = [];
    const invalidLines: string[] = [];

    lines.forEach((line, index) => {
      const parsed = parseCustomFormat(line);
      if (parsed && parsed.url) {
        const newLink: VideoLink = {
          title: parsed.title,
          url: parsed.url,
          type: 'youtube'
        };
        
        // Validate the link before adding
        if (newLink.title && newLink.url && 
            newLink.title !== 'undefined' && newLink.url !== 'undefined') {
          newLinks.push(newLink);
        } else {
          console.warn(`Invalid video link at line ${index + 1}:`, parsed);
          invalidLines.push(`Line ${index + 1}: "${line}"`);
        }
      } else {
        console.warn(`Invalid format at line ${index + 1}: "${line}". Expected format: "title:url"`);
        invalidLines.push(`Line ${index + 1}: "${line}"`);
      }
    });

    if (newLinks.length > 0) {
      onLinksChange([...links, ...newLinks]);
      setBulkInput('');
      
      // Show success message
      alert(`Successfully added ${newLinks.length} video link(s)!`);
      
      // Show warnings for invalid lines if any
      if (invalidLines.length > 0) {
        console.warn('Invalid lines found:', invalidLines);
        alert(`Warning: ${invalidLines.length} line(s) were skipped due to invalid format:\n\n${invalidLines.slice(0, 5).join('\n')}${invalidLines.length > 5 ? '\n... and more' : ''}`);
      }
    } else {
      const message = 'No valid video links found in bulk input. Please check the format (title:url).';
      console.warn(message);
      alert(message);
    }
  };

  const addPlaylistLinks = async () => {
    if (!playlistUrl.trim()) return;

    try {
      const videoLinks = await processYouTubePlaylist(playlistUrl);
      
      if (videoLinks && videoLinks.length > 0) {
        // Validate each video link before adding
        const validLinks = videoLinks.filter((link, index) => {
          if (!link.title || !link.url) {
            console.warn(`Invalid video link found at index ${index}:`, link);
            return false;
          }
          return true;
        });
        
        if (validLinks.length > 0) {
          // Convert to VideoLink type to ensure compatibility
          const convertedLinks: VideoLink[] = validLinks.map(link => ({
            title: link.title,
            url: link.url,
            type: 'youtube'
          }));
            
          onLinksChange([...links, ...convertedLinks]);
          setPlaylistUrl('');
          
          // Show success message
          alert(`Successfully added ${convertedLinks.length} video(s) from the playlist!`);
        } else {
          alert('No valid video links found in playlist');
        }
      } else {
        alert('No video links found in playlist');
      }
    } catch (error) {
      const errorMessage = `Error processing playlist: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('Error processing playlist:', error);
      alert(errorMessage);
    }
  };

  const removeLink = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index);
    onLinksChange(newLinks);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium text-foreground">YouTube Video Links</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Add YouTube video links for your course. Only YouTube videos are supported.
        </p>
      </div>

      {/* Upload Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Add YouTube Videos</CardTitle>
          <CardDescription className="text-muted-foreground">
            Choose how to add your YouTube video links
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="single" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Single Link
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Bulk Upload
              </TabsTrigger>
              <TabsTrigger value="playlist" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Playlist
              </TabsTrigger>
            </TabsList>

            {/* Single Link Upload */}
            <TabsContent value="single" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="video-title" className="text-foreground">Video Title</Label>
                  <Input
                    id="video-title"
                    value={currentTitle}
                    onChange={(e) => setCurrentTitle(e.target.value)}
                    placeholder="e.g., Introduction to JavaScript"
                    disabled={disabled}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="video-url" className="text-foreground">YouTube URL</Label>
                  <Input
                    id="video-url"
                    value={currentUrl}
                    onChange={(e) => setCurrentUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    disabled={disabled}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-red-500 text-white border-red-500">
                  <Youtube className="h-4 w-4" />
                  <span className="ml-1">YouTube</span>
                </Badge>
              </div>

              <Button
                type="button"
                onClick={addLink}
                disabled={!currentTitle.trim() || !currentUrl.trim() || disabled}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add YouTube Video
              </Button>
            </TabsContent>

            {/* Bulk Upload */}
            <TabsContent value="bulk" className="space-y-4">
              <div>
                <Label className="text-foreground">Bulk Upload</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Add multiple YouTube links in format: <code className="bg-gray-100 px-1 rounded">title:url</code> (one per line)
                </p>
                <Textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder={`Example:
JavaScript Basics:https://www.youtube.com/watch?v=abc123
Advanced JavaScript:https://www.youtube.com/watch?v=def456
React Tutorial:https://www.youtube.com/watch?v=ghi789`}
                  rows={6}
                  disabled={disabled}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-red-500 text-white border-red-500">
                  <Youtube className="h-4 w-4" />
                  <span className="ml-1">YouTube</span>
                </Badge>
                <span className="text-xs text-muted-foreground">
                  All links will be processed as YouTube links
                </span>
              </div>

              <Button
                type="button"
                onClick={addBulkLinks}
                disabled={!bulkInput.trim() || disabled}
                className="w-full"
              >
                <List className="h-4 w-4 mr-2" />
                Add Bulk Links
              </Button>
            </TabsContent>

            {/* YouTube Playlist */}
            <TabsContent value="playlist" className="space-y-4">
              <div>
                <Label className="text-foreground">YouTube Playlist</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Enter a YouTube playlist URL to automatically extract all videos
                </p>
                <Input
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  placeholder="https://www.youtube.com/playlist?list=PL..."
                  disabled={disabled}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-red-500 text-white border-red-500">
                  <Youtube className="h-4 w-4" />
                  <span className="ml-1">YouTube Playlist</span>
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Videos will be automatically extracted from the playlist
                </span>
              </div>

              <Button
                type="button"
                onClick={addPlaylistLinks}
                disabled={!playlistUrl.trim() || disabled}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Extract Playlist Videos
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Existing Links */}
      {links.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Added YouTube Videos ({links.length})</CardTitle>
            <CardDescription className="text-muted-foreground">
              Review and manage your YouTube video links
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {links.map((link, index) => {
                // Debug logging for undefined values
                if (!link.title || !link.url || link.title === 'undefined' || link.url === 'undefined') {
                  console.warn(`Invalid link at index ${index}:`, link);
                }
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded bg-red-500 text-white">
                        <Youtube className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">
                            {link.title && link.title !== 'undefined' ? link.title : 'Untitled'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            YouTube
                          </Badge>
                          {(!link.title || link.title === 'undefined') && (
                            <Badge variant="destructive" className="text-xs">
                              Invalid Title
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {link.url && link.url !== 'undefined' ? link.url : 'No URL'}
                        </div>
                        {(!link.url || link.url === 'undefined') && (
                          <div className="text-xs text-red-600 mt-1">
                            ⚠️ Invalid URL
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLink(index)}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}