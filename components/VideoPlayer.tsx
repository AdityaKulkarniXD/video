'use client';

import { useEffect, useRef, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  autoPlay?: boolean;
  playsInline?: boolean;
  className?: string;
  poster?: string;
  loading?: boolean;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ stream, muted = false, autoPlay = true, playsInline = true, className, poster, loading = false }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      const video = ref ? (ref as React.RefObject<HTMLVideoElement>).current : videoRef.current;
      
      if (video && stream) {
        video.srcObject = stream;
      }
    }, [stream, ref]);

    const combinedRef = ref || videoRef;

    return (
      <div className="relative">
        <video
          ref={combinedRef}
          autoPlay={autoPlay}
          muted={muted}
          playsInline={playsInline}
          poster={poster}
          className={cn(
            "w-full h-full object-cover bg-gray-900 rounded-lg",
            loading && "animate-pulse",
            className
          )}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <p className="text-white text-sm">Connecting...</p>
            </div>
          </div>
        )}
        {!stream && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-gray-500 rounded-full" />
              </div>
              <p className="text-gray-400 text-sm">No video</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';