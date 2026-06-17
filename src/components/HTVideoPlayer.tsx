import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, RotateCcw, AlertTriangle, RefreshCw } from 'lucide-react';

interface HTVideoPlayerProps {
  videoUrl: string;
  title: string;
  thumbnail?: string;
  onClose?: () => void;
}

export function HTVideoPlayer({ videoUrl, title, thumbnail, onClose }: HTVideoPlayerProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [retryKey, setRetryKey] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Helper utility to clean / translate Firebase Storage URLs and other paths
  const getProcessedUrl = (url: string): string => {
    if (!url) return '';
    const trimmed = url.trim();
    // Translate gs:// urls to download HTTPS urls
    if (trimmed.startsWith('gs://')) {
      const clean = trimmed.substring(5);
      const firstSlash = clean.indexOf('/');
      if (firstSlash !== -1) {
        const bucket = clean.substring(0, firstSlash);
        const filePath = clean.substring(firstSlash + 1);
        const encodedPath = encodeURIComponent(filePath);
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
      }
    }
    return trimmed;
  };

  const processedUrl = getProcessedUrl(videoUrl);

  // YouTube parser to support integrated embedded flows
  const getYouTubeEmbedUrl = (urlStr: string) => {
    if (!urlStr) return '';
    if (urlStr.includes('/embed/')) return urlStr;
    
    let videoId = '';
    try {
      const trimmed = urlStr.trim();
      if (trimmed.includes('youtu.be/')) {
        videoId = trimmed.split('youtu.be/')[1]?.split(/[?#]/)[0] || '';
      } else if (trimmed.includes('v=')) {
        videoId = trimmed.split('v=')[1]?.split('&')[0]?.split(/[?#]/)[0] || '';
      } else if (trimmed.includes('embed/')) {
        videoId = trimmed.split('embed/')[1]?.split(/[?#]/)[0] || '';
      } else if (trimmed.length === 11) {
        videoId = trimmed;
      }
    } catch (e) {
      console.error("Error parsing YouTube video ID: ", e);
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  };

  const embedUrl = getYouTubeEmbedUrl(processedUrl);
  const isYoutube = !!embedUrl;

  // Parse file format support for non-Youtube videos
  const checkFormatSupported = (url: string): boolean => {
    if (!url || isYoutube) return true;
    const cleanUrl = url.split('?')[0].toLowerCase();
    const unsupportedSuffixes = ['.avi', '.wmv', '.flv', '.mkv', '.3gp'];
    return !unsupportedSuffixes.some(suffix => cleanUrl.endsWith(suffix));
  };

  const isSupported = checkFormatSupported(processedUrl);

  const handleVideoLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleVideoCanPlay = () => {
    setLoading(false);
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error("HTML Video Error details: ", e);
    // Standard error description
    setError("Video failed to load. Please try again.");
    setLoading(false);
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setRetryKey(prev => prev + 1);
    
    // Explicitly reload video node if initialized
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked by browser when unmuted, which is expected
      });
    }
  };

  // Attempt muted autoplay on mount/retry for optimal mobile rendering and standard desktop compliance
  useEffect(() => {
    if (videoRef.current && !isYoutube) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {
        // Autoplay blocked fallback is fine
      });
    }
    if (isYoutube) {
      setLoading(false);
    }
  }, [processedUrl, retryKey, isYoutube]);

  return (
    <div className="w-full flex flex-col space-y-3" id="HTVideoPlayerContainer">
      {/* Unsupported Format Warning Bar */}
      {!isSupported && (
        <div className="bg-amber-950/40 border border-amber-600/30 rounded-xl p-3 flex gap-2.5 items-start text-left">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-[11px] font-bold text-amber-300 uppercase tracking-widest font-mono">Unsupported Video Format</h4>
            <p className="text-xs text-zinc-300 leading-normal">
              This video format is not supported. Please try another video.
            </p>
          </div>
        </div>
      )}

      {/* Main Video Stage */}
      <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden border border-zinc-900 group flex items-center justify-center">
        {/* Loading Spinner overlay */}
        {loading && !error && (
          <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center bg-black/60 z-10">
            <RefreshCw className="w-6 h-6 text-[#F5C518] animate-spin" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Streaming walkaround stream...</span>
          </div>
        )}

        {/* Error overlay with Retry control */}
        {error ? (
          <div className="absolute inset-0 flex flex-col gap-3 items-center justify-center bg-zinc-950/90 z-20 p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 animate-pulse" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-200">Video failed to load. Please try again.</p>
              <p className="text-[10px] text-zinc-500 font-mono select-all truncate max-w-sm">{processedUrl}</p>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry Load</span>
            </button>
          </div>
        ) : null}

        {/* Video Player element */}
        {isYoutube ? (
          <iframe
            src={`${embedUrl}?autoplay=1`}
            title={title}
            className="w-full h-full border-0 absolute inset-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            key={`${processedUrl}-${retryKey}`}
            ref={videoRef}
            id="videoPlayer"
            controls
            playsInline
            autoPlay
            muted
            src={processedUrl}
            poster={thumbnail || undefined}
            onLoadStart={handleVideoLoadStart}
            onCanPlay={handleVideoCanPlay}
            onError={handleVideoError}
            style={{ width: "100%", maxHeight: "400px", borderRadius: "8px" }}
            className="w-full h-full object-contain focus:outline-none"
          />
        )}
      </div>

      {/* Help message for iOS / mobile */}
      <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 px-1">
        <span>🎬 AUTO-STREAMING READY</span>
        <span>TAP CONTROLS TO UNMUTE OR EXPAND</span>
      </div>
    </div>
  );
}
