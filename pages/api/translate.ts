import { Redis } from "@upstash/redis";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { getPayload, parse_gpt_resp } from "@/lib/openai/prompt";
import { isDev } from "@/utils/env";
import { Node } from "@/lib/srt"
import { OpenAIResult } from "@/lib/openai/OpenAIResult";
import { digestMessage, getRandomInt } from "@/utils/fp";

export const config = {
    runtime: "edge",
}

const redis = Redis.fromEnv();

if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing env var from OpenAI");
}

function sentences_to_nodes(sentences: string[]): Node[] {
    const start = getRandomInt(100, 999);
    return sentences.map((sentence,idx) => {return {pos:(start+idx).toString(), content: sentence}});
}

export default async function handler(
    req: NextRequest,
    context: NextFetchEvent
) {
    const {sentences, targetLang, srcLang, apiKey} = (await req.json()) as {
        sentences: string[];
        targetLang: string;
        srcLang?: string;
        apiKey?: string;
    }
    if (!sentences || sentences.length === 0) {
        return new Response("no subtitles", { status: 500 });
    }

    const nodes = sentences_to_nodes(sentences);
    const payload = getPayload(nodes, targetLang, srcLang);

    try {
        apiKey && console.log("=====use user api key=====");
        isDev && console.log("payload", payload);
        const result = await OpenAIResult(payload, apiKey);
        const resp = parse_gpt_resp(result);

        let rkey = `${targetLang}_${srcLang}_${sentences}}`;
        rkey = "tranres_" + await digestMessage(rkey);
        const data = await redis.set(rkey, JSON.stringify(resp));
        console.log("cached data", data);

        return NextResponse.json(resp);
    } catch (error: any) {
        console.log("API error", error, error.message);
        return NextResponse.json({
            errorMessage: error.message,
        });
    }
}