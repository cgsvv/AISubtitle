import { Redis } from "@upstash/redis";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { getPayload, parse_gpt_resp } from "@/lib/openai/prompt";
import { isDev } from "@/utils/env";
import { OpenAIResult } from "@/lib/openai/OpenAIResult";
import { digestMessage, getRandomInt } from "@/utils/fp";

export const config = {
    runtime: "edge",
}

// const redis = Redis.fromEnv();

if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing env var from OpenAI");
}

export default async function handler(
    req: NextRequest,
    context: NextFetchEvent
) {
    const {sentences, targetLang, srcLang, apiKey, promptTemplate} = (await req.json()) as {
        sentences: string[];
        targetLang: string;
        srcLang?: string;
        apiKey?: string;
        promptTemplate?: string;
    }
    if (!sentences || sentences.length === 0) {
        return new Response("no subtitles", { status: 500 });
    }

    const payload = getPayload(sentences, targetLang, srcLang, promptTemplate);
    const {res_keys} = payload;

    try {
        apiKey && console.log("=====use user api key=====");
        isDev && console.log("payload", payload);
        const result = await OpenAIResult(payload, apiKey);
        const resp = parse_gpt_resp(result, res_keys!);

        // let rkey = `${targetLang}_${srcLang}_${sentences}}`;
        // rkey = "tranres_" + await digestMessage(rkey);
        // const data = await redis.set(rkey, JSON.stringify(resp));
        // console.log("cached data", data);

        return NextResponse.json(resp);
    } catch (error: any) {
        console.log("API error", error, error.message);
        return NextResponse.json({
            errorMessage: error.message,
        });
    }
}