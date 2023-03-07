import { Redis } from "@upstash/redis";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { getPayload } from "@/lib/openai/prompt";
import { isDev } from "@/utils/env";
import { Node } from "@/lib/srt"
import { OpenAIResult } from "@/lib/openai/OpenAIResult";

export const config = {
    runtime: "edge",
}

if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing env var from OpenAI");
}

export default async function handler(
    req: NextRequest,
    context: NextFetchEvent
) {
    const {nodes, targetLang, srcLang, apiKey} = (await req.json()) as {
        nodes: Node[];
        targetLang: string;
        srcLang?: string;
        apiKey?: string;
    }
    if (!nodes || nodes.length === 0) {
        return new Response("no subtitles", { status: 500 });
    }

    const payload = getPayload(nodes, targetLang, srcLang);

    try {
        apiKey && console.log("=====use user api key=====");
        isDev && console.log("payload", payload);
        const result = await OpenAIResult(payload, apiKey);

        return NextResponse.json(result);
    } catch (error: any) {
        console.log("API error", error, error.message);
        return NextResponse.json({
            errorMessage: error.message,
        });
    }
}