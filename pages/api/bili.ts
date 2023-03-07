import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { fetchBiliSubtitlesToNodes } from "@/lib/bilibili";

export const config = {
    runtime: "edge",
}

export default async function handler(
    req: NextRequest,
    context: NextFetchEvent
) {
    const { searchParams } = new URL(req.url);
    const biliId = searchParams.get("biliId");
    if (!biliId) {
        return new Response("no subtitles", { status: 500 });
    }
    const res = await fetchBiliSubtitlesToNodes(biliId);
    return NextResponse.json(res);
}