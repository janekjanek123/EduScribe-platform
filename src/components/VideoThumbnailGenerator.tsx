'use client';

import React, { useRef, useEffect, useState } from 'react';

interface VideoThumbnailProps {
  videoSrc: string;
  alt: string;
  className?: string;
  timeOffset?: number; // Time in seconds to capture thumbnail
  onThumbnailGenerated?: (dataUrl: string) => void;
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  videoSrc,
  alt,
  className = '',
  timeOffset = 2,
  onThumbnailGenerated
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const generateThumbnail = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setThumbnailUrl(dataUrl);
      setIsLoading(false);
      
      if (onThumbnailGenerated) {
        onThumbnailGenerated(dataUrl);
      }
      
      // Hide any fallback elements
      const parentElement = video.closest('.relative');
      if (parentElement) {
        const fallbackElement = parentElement.querySelector('.absolute.inset-0');
        if (fallbackElement) {
          (fallbackElement as HTMLElement).style.display = 'none';
        }
      }
    };

    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      // Seek to the specified time offset
      video.currentTime = Math.min(timeOffset, video.duration);
    };

    const handleSeeked = () => {
      generateThumbnail();
    };

    const handleError = () => {
      setError('Failed to load video');
      setIsLoading(false);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
    };
  }, [videoSrc, timeOffset, onThumbnailGenerated]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-800 text-gray-400 ${className}`}>
        <div className="text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="text-sm">Failed to load video</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-gray-400 ${className}`}>
        <div className="text-center">
          <div className="text-2xl mb-2 animate-spin">⏳</div>
          <div className="text-sm">Loading video...</div>
          <div className="text-xs opacity-60 mt-1">Large file</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hidden video element for thumbnail generation */}
      <video
        ref={videoRef}
        src={videoSrc}
        style={{ display: 'none' }}
        muted
        playsInline
      />
      
      {/* Hidden canvas for frame capture */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      
      {/* Display the generated thumbnail */}
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt={alt}
          className={className}
        />
      )}
    </>
  );
};

export default VideoThumbnail; 