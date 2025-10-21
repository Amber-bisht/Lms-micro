import React, { createContext, useContext, useState, ReactNode } from 'react';

export type VideoPlayerType = 'youtube' | null;

interface VideoPlayerContextType {
  currentPlayerType: VideoPlayerType;
  setCurrentPlayerType: (type: VideoPlayerType) => void;
}

const VideoPlayerContext = createContext<VideoPlayerContextType | undefined>(undefined);

export const useVideoPlayer = () => {
  const context = useContext(VideoPlayerContext);
  if (context === undefined) {
    throw new Error('useVideoPlayer must be used within a VideoPlayerProvider');
  }
  return context;
};

interface VideoPlayerProviderProps {
  children: ReactNode;
}

export const VideoPlayerProvider: React.FC<VideoPlayerProviderProps> = ({ children }) => {
  const [currentPlayerType, setCurrentPlayerType] = useState<VideoPlayerType>(null);

  return (
    <VideoPlayerContext.Provider value={{ currentPlayerType, setCurrentPlayerType }}>
      {children}
    </VideoPlayerContext.Provider>
  );
};
