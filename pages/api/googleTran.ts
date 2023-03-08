import translate from 'google-translate-api-x';
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { getLocale } from '@/lib/lang';

// to like "en", "zh-CN"
async function trans_texts(texts: string[], to: string) {
    const res = await translate(texts, {to: to});
    return res.map((item) => item.text);
}

export const config = {
    runtime: "edge",
}

export default async function handler(
    req: NextRequest,
    context: NextFetchEvent
) {
    const {sentences, targetLang, srcLang} = (await req.json()) as {
        sentences: string[];
        targetLang: string;
        srcLang?: string;
    }
    if (!sentences || sentences.length === 0) {
        return new Response("no subtitles", { status: 500 });
    }

    try {
        const resp = await trans_texts(sentences, getLocale(targetLang)!);
        return NextResponse.json(resp);
    } catch (error: any) {
        console.log("API error", error, error.message);
        return NextResponse.json({
            errorMessage: error.message,
        });
    }
}