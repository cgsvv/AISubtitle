import { Redis } from "@upstash/redis";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
// import { validateLicenseKey } from "./lib/lemon";
import { checkOpenaiApiKeys } from "./lib/openai/openai";
import { ratelimit } from "./lib/upstash"
import { isDev } from "./utils/env";
import { digestMessage } from "./utils/fp";

const redis = Redis.fromEnv();

export async function middleware(req: NextRequest, context: NextFetchEvent) {
  const { sentences, targetLang, srcLang, apiKey } = await req.json();
  let rkey = `${targetLang}_${srcLang}_${sentences}}`;
  rkey = "tranres_" + await digestMessage(rkey);
  const cached = await redis.get<string[]>(rkey);
  
  //if (!isDev && cached) {
  if (cached) {
    console.log("Using cached response");
    return NextResponse.json(cached);
  }

  // licenseKeys
  if (apiKey) {
    if (checkOpenaiApiKeys(apiKey)) {
      return NextResponse.next();
    }

    // // 3. something-invalid-sdalkjfasncs-key
    // if (!(await validateLicenseKey(apiKey, bvId))) {
    //   return NextResponse.redirect(new URL("/shop", req.url));
    // }
  }
  // TODO: unique to a user (userid, email etc) instead of IP
  const identifier = req.ip ?? "127.0.0.7";
  const { success, remaining } = await ratelimit.limit("trans-" + identifier);
  console.log(`======== ip ${identifier}, remaining: ${remaining} ========`);
  if (!apiKey && !success) {
    // return NextResponse.redirect(new URL("/shop", req.url));
    return NextResponse.json({
      errorMessage: "rate limited",
    });
  }
}

export const config = {
  matcher: "/api/translate",
};
