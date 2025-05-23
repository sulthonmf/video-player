import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const filename = params?.filename;
  const videoPath = path.join(process.cwd(), "public", filename);

  if (!fs.existsSync(videoPath)) {
    console.error(`Video file not found at: ${videoPath}`);
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const videoStat = fs.statSync(videoPath);
  const fileSize = videoStat.size;
  const range = request.headers.get("range");

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start < 0 || start > end) {
      return NextResponse.json(
        { error: "Range Not Satisfiable" },
        { status: 416 }
      );
    }

    const chunkSize = end - start + 1;
    const fileStream = fs.createReadStream(videoPath, { start, end });

    return new Response(fileStream as never, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize.toString(),
        "Content-Type": "video/mp4",
      },
    });
  } else {
    return new Response(fs.createReadStream(videoPath) as never, {
      status: 200,
      headers: {
        "Content-Length": fileSize.toString(),
        "Content-Type": "video/mp4",
      },
    });
  }
}
