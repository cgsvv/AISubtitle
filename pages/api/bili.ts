import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { fetchBiliSubtitlesToNodes } from "@/lib/bilibili";
import { fetchYoutubeSubtitleToNodes } from "@/lib/youtube";

export const config = {
    runtime: "edge",
}

export default async function handler(
    req: NextRequest,
    context: NextFetchEvent
) {
    const { searchParams } = new URL(req.url);
    const biliId = searchParams.get("biliId");
    const isYoutube = searchParams.get("service") === "youtube";
    if (!biliId) {
        return new Response("no subtitles", { status: 500 });
    }
    
    const f = isYoutube ? fetchYoutubeSubtitleToNodes : fetchBiliSubtitlesToNodes;
    const res = await f(biliId);
    return NextResponse.json(res);
}