import { Redis } from "@upstash/redis";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { activateLicenseKey } from "./lib/lemon";
import { checkOpenaiApiKeys } from "./lib/openai/openai";
import { ratelimit } from "./lib/upstash"
import { isDev } from "./utils/env";
import { digestMessage } from "./utils/fp";

//const redis = Redis.fromEnv();

export async function middleware(req: NextRequest, context: NextFetchEvent) {
  const { sentences, targetLang, srcLang, apiKey } = await req.json();
  let rkey = `${targetLang}_${srcLang}_${sentences}}`;
  rkey = "tranres_" + await digestMessage(rkey);
  // const cached = await redis.get<string[]>(rkey);
  
  // if (!isDev && cached) {
  // //if (cached) {
  //   console.log("Using cached response " + rkey);
  //   return NextResponse.json(cached);
  // }

  // licenseKeys
  if (apiKey) {
    if (checkOpenaiApiKeys(apiKey)) {
      return NextResponse.next();
    }

    // // 3. something-invalid-sdalkjfasncs-key
    if (!(await activateLicenseKey(apiKey, rkey.substring(8, 16)))) {
      return NextResponse.redirect(new URL("/shop", req.url));
    }
  }
  // TODO: unique to a user (userid, email etc) instead of IP
  // const identifier = req.ip ?? "127.0.0.7";
  // const { success, remaining } = await ratelimit.limit("trans-" + identifier);
  // console.log(`======== ip ${identifier}, remaining: ${remaining} ========`);
  // if (!apiKey && !success) {
  if (!apiKey) {
    return NextResponse.redirect(new URL("/shop", req.url));
  }
}

export const config = {
  matcher: "/api/translate",
};
