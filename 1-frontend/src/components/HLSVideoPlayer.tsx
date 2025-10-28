import React, { useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Loader2, Video } from 'lucide-react';

interface HLSVideoPlayerProps {
  videoUrl: string;
  poster?: string;
  className?: string;
  autoplay?: boolean;
  controls?: boolean;
}

export function HLSVideoPlayer({
  videoUrl,
  poster,
  className,
  autoplay = false,
  controls = true,
}: HLSVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: any;

    const loadVideo = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if HLS.js is available
        if (videoUrl.includes('.m3u8')) {
          // Dynamic import of hls.js
          const Hls = (await import('hls.js')).default;

          if (Hls.isSupported()) {
            hls = new Hls({
              debug: false,
              enableWorker: true,
              lowLatencyMode: false,
            });

            hls.loadSource(videoUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setIsLoading(false);
              if (autoplay) {
                video.play().catch(() => {
                  console.log('Autoplay prevented');
                });
              }
            });

            hls.on(Hls.Events.ERROR, (event: any, data: any) => {
              console.error('HLS error:', data);
              if (data.fatal) {
                setError('Failed to load video');
                setIsLoading(false);
              }
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            video.src = videoUrl;
            setIsLoading(false);
          } else {
            setError('HLS playback not supported');
            setIsLoading(false);
          }
        } else {
          // Regular video file
          video.src = videoUrl;
          setIsLoading(false);
        }

        // Video loaded
        video.addEventListener('loadeddata', () => {
          setIsLoading(false);
        });

        video.addEventListener('error', () => {
          setError('Failed to load video');
          setIsLoading(false);
        });
      } catch (err) {
        console.error('Video loading error:', err);
        setError('Failed to load video');
        setIsLoading(false);
      }
    };

    loadVideo();

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [videoUrl, autoplay]);

  if (error) {
    return (
      <Card className={className}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Unable to load video</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={className}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        controls={controls}
        poster={poster}
        playsInline
        className="w-full h-full"
      />
    </div>
  );
}

