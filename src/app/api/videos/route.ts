import { NextResponse } from "next/server";

export async function GET() {
  const videoList = [
    {
      id: "video1",
      title: "Perjalanan ke Gunung Everest",
      filename: "video1.mp4",
      thumbnail: "video1.mp4",
    },
    {
      id: "video2",
      title: "Pesona Pantai Bali",
      filename: "video2.mp4",
      thumbnail: "video2.mp4",
    },
    {
      id: "video3",
      title: "Metropolitan Jakarta Malam Hari",
      filename: "video3.mp4",
      thumbnail: "video3.mp4",
    },
    {
      id: "video4",
      title: "Hutan Amazon: Paru-paru Dunia",
      filename: "video4.mp4",
      thumbnail: "video4.mp4",
    },
  ];

  return NextResponse.json(videoList);
}
