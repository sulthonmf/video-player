"use client";

import React, { useState, useEffect, useRef } from "react";
import VideoPlayer from "@/components/VideoPlayer";

interface VideoInfo {
  id: string;
  title: string;
  filename: string;
  thumbnail: string;
}

const Home: React.FC = () => {
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [selectedVideoFilename, setSelectedVideoFilename] = useState<
    string | null
  >(null);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [errorLoadingVideos, setErrorLoadingVideos] = useState<string | null>(
    null
  );

  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch("/api/videos");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: VideoInfo[] = await response.json();
        setVideos(data);
        if (data.length > 0) {
          setSelectedVideoFilename(data[0].filename);
        }
      } catch (e: any) {
        setErrorLoadingVideos(e.message);
      } finally {
        setLoadingVideos(false);
      }
    };

    fetchVideos();
  }, []);

  const handleMouseEnter = (id: string) => {
    setHoveredVideoId(id);
    const video = videoRefs.current[id];
    if (video && id !== selectedVideoFilename) {
      video.currentTime = 0;
      video
        .play()
        .catch((error) => console.warn("Preview play failed:", error));
    }
  };

  const handleMouseLeave = (id: string) => {
    setHoveredVideoId(null);
    const video = videoRefs.current[id];
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

  if (loadingVideos) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
        <p>Loading video list...</p>
      </div>
    );
  }

  if (errorLoadingVideos) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-100 text-red-500">
        <p>Error loading video list: {errorLoadingVideos}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white px-4">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-10 text-transparent bg-clip-text bg-black dark:bg-white">
        Video Library
      </h1>

      <div className="w-full max-w-4xl mb-12">
        {selectedVideoFilename ? (
          <VideoPlayer filename={selectedVideoFilename} />
        ) : (
          <div className="flex items-center justify-center h-96 bg-gray-200 dark:bg-gray-800 rounded-lg text-lg text-gray-600 dark:text-gray-400 shadow-inner">
            Please select a video to play.
          </div>
        )}
      </div>

      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-6 text-center md:text-left">
          More Videos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              onClick={() => setSelectedVideoFilename(video.filename)}
              onMouseEnter={() => handleMouseEnter(video.id)}
              onMouseLeave={() => handleMouseLeave(video.id)}
              className={`
                relative cursor-pointer rounded-lg overflow-hidden shadow-md
                transform transition-transform duration-300 ease-in-out
                ${
                  selectedVideoFilename === video.filename
                    ? "ring-4 ring-blue-500"
                    : "hover:scale-105 hover:shadow-lg"
                }
              `}
            >
              <div className="relative w-full aspect-video bg-black">
                <video
                  ref={(el) => (videoRefs.current[video.id] = el)}
                  src={`/api/video/${video.thumbnail}`}
                  preload="metadata"
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover transition-transform duration-300 ease-in-out"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800">
                <h3 className="text-base font-semibold truncate text-gray-900 dark:text-white">
                  {video.title}
                </h3>
              </div>
              {selectedVideoFilename === video.filename && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-lg font-bold">
                  Now Playing
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
