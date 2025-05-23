import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

interface VideoPlayerProps {
  filename: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ filename }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsHideTimeout = useRef<NodeJS.Timeout | null>(null);

  const drawVideoToCanvas = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const aspectRatio = video.videoWidth / video.videoHeight;
        const parentWidth = canvas.parentElement?.clientWidth || 640;
        canvas.width = parentWidth;
        canvas.height = parentWidth / aspectRatio;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (controlsVisible || !isPlaying) {
          ctx.font = "20px Arial";
          ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
          ctx.fillText(filename, 20, 30);

          const formattedTime = formatTime(video.currentTime);
          ctx.font = "16px Arial";
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          ctx.fillText(
            formattedTime,
            canvas.width - ctx.measureText(formattedTime).width - 20,
            30
          );
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(drawVideoToCanvas);
  }, [controlsVisible, filename, isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !filename) {
      setError("Video element or filename is missing.");
      return;
    }

    setIsLoading(true);
    setError(null);

    video.src = `/api/video/${filename}`;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);

      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      animationFrameId.current = requestAnimationFrame(drawVideoToCanvas);

      if (isPlaying) {
        video.play().catch((error) => {
          console.warn("Autoplay was prevented:", error);
          setIsPlaying(false);
          setControlsVisible(true);
        });
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (isPlaying && controlsVisible) {
        if (controlsHideTimeout.current) {
          clearTimeout(controlsHideTimeout.current);
        }
        controlsHideTimeout.current = setTimeout(() => {
          setControlsVisible(false);
        }, 3000);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => {
      setIsPlaying(false);
      setControlsVisible(true);
      if (controlsHideTimeout.current) {
        clearTimeout(controlsHideTimeout.current);
      }
    };
    const handleError = () => {
      setError("Failed to load video. Please try again.");
      setIsLoading(false);
    };
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("error", handleError);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);

    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("error", handleError);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (controlsHideTimeout.current) {
        clearTimeout(controlsHideTimeout.current);
      }

      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange
      );
    };
  }, [filename, drawVideoToCanvas, isPlaying, controlsVisible]);

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (video) {
      const newTime = parseFloat(event.target.value);
      video.currentTime = newTime;
      setCurrentTime(newTime);

      if (!isPlaying) {
        video.play();
        setTimeout(() => {
          video.pause();
        }, 50);
      }
      setControlsVisible(true);
      if (controlsHideTimeout.current) {
        clearTimeout(controlsHideTimeout.current);
      }
    }
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (video) {
      const newVolume = parseFloat(event.target.value);
      video.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
      if (!video.muted && video.volume === 0) {
        video.volume = 0.5;
        setVolume(0.5);
      }
    }
  };

  const toggleFullscreen = () => {
    const videoContainer = canvasRef.current?.parentElement;
    if (videoContainer) {
      if (!document.fullscreenElement) {
        if (videoContainer.requestFullscreen) {
          videoContainer.requestFullscreen();
        } else if ((videoContainer as any).webkitRequestFullscreen) {
          /* Safari */
          (videoContainer as any).webkitRequestFullscreen();
        } else if ((videoContainer as any).msRequestFullscreen) {
          /* IE11 */
          (videoContainer as any).msRequestFullscreen();
        } else if ((videoContainer as any).mozRequestFullScreen) {
          /* Firefox */
          (videoContainer as any).mozRequestFullScreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          /* Safari */
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          /* IE11 */
          (document as any).msExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          /* Firefox */
          (document as any).mozCancelFullScreen();
        }
      }
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        video.play().catch((error) => {
          console.warn("Play failed:", error);
          setIsPlaying(false);
        });
        setIsPlaying(true);
      }
      setControlsVisible(true);
      if (controlsHideTimeout.current) {
        clearTimeout(controlsHideTimeout.current);
      }
    }
  };

  const handleMouseEnterVideo = () => {
    setControlsVisible(true);
    if (controlsHideTimeout.current) {
      clearTimeout(controlsHideTimeout.current);
    }
  };

  const handleMouseLeaveVideo = () => {
    if (isPlaying) {
      controlsHideTimeout.current = setTimeout(() => {
        setControlsVisible(false);
      }, 1000);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-red-100 text-red-700 rounded-md">
        <p>Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full aspect-video bg-black rounded-lg shadow-lg overflow-hidden ${
        isFullScreen ? "fixed inset-0 z-50 rounded-none" : ""
      }`}
      onMouseEnter={handleMouseEnterVideo}
      onMouseLeave={handleMouseLeaveVideo}
    >
      <video
        ref={videoRef}
        className="hidden"
        muted={isMuted}
        onVolumeChange={(e) => setVolume(e.currentTarget.volume)}
      />

      <canvas ref={canvasRef} className="w-full h-full block"></canvas>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white text-lg">
          Loading video...
        </div>
      )}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent text-white transition-opacity duration-300 ease-in-out ${
          controlsVisible ? "opacity-90" : "opacity-0 pointer-events-none"
        }`}
      >
        <input
          type="range"
          min="0"
          max={duration}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg [&::-webkit-slider-thumb]:bg-red-500 [&::-moz-range-thumb]:bg-red-500"
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlayPause}
              className="p-1 rounded-full hover:bg-transparent transition-colors"
            >
              <Image
                src={isPlaying ? "/icons/pause.png" : "/icons/play.png"}
                alt={isPlaying ? "Pause" : "Play"}
                width={24}
                height={24}
                className="filter"
              />
            </button>
            <div className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleMute}
              className="p-1 rounded-full hover:bg-transparent transition-colors"
            >
              <Image
                src={
                  isMuted || volume === 0
                    ? "/icons/mute.png"
                    : "/icons/volume-up.png"
                }
                alt={isMuted || volume === 0 ? "Muted" : "Volume"}
                width={24}
                height={24}
                className="filter"
              />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm [&::-webkit-slider-thumb]:bg-red-500 [&::-moz-range-thumb]:bg-red-500"
            />
            <button
              onClick={toggleFullscreen}
              className="p-1 rounded-full hover:bg-transparent transition-colors"
            >
              <Image
                src={isFullScreen ? "/icons/collapse.png" : "/icons/expand.png"}
                alt={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
                width={24}
                height={24}
                className="filter"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
