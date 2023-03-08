import { sample } from "../utils/fp";
import { Node } from "./srt";

const run = async (bvId: string) => {
  const requestUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvId}`;
  console.log(`fetch`, requestUrl);
  const sessdata = sample(process.env.BILIBILI_SESSION_TOKEN?.split(","));
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
    Host: "api.bilibili.com",
    Cookie: `SESSDATA=${sessdata}`,
  };
  const response = await fetch(requestUrl, {
    method: "GET",
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    headers,
    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
  });
  const json = await response.json();
  // return json.data.View;
  return json.data;
};

export async function fetchSubtitle(bvId: string) {
  // const res = await pRetry(async () => await run(bvId), {
  //   onFailedAttempt: (error) => {
  //     console.log(
  //       `Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`
  //     );
  //   },
  //   retries: 2,
  // });
  // @ts-ignore
  const res = await run(bvId);
  const title = res?.title;
  const subtitleList = res?.subtitle?.list;
  if (!subtitleList || subtitleList?.length < 1) {
    return { title, subtitles: null };
  }

  const betterSubtitle =
    subtitleList.find(({ lan }: { lan: string }) => lan === "zh-CN") ||
    subtitleList[0];
  const subtitleUrl = betterSubtitle?.subtitle_url;
  console.log("subtitle_url", subtitleUrl);

  const subtitleResponse = await fetch(subtitleUrl);
  const subtitles = await subtitleResponse.json();
  return { title, subtitles };
}

function pad2(num: number) {
  return num.toString().padStart(2, "0");
}

function pad3(num: number) {
  return num.toString().padStart(3, "0");
}

export function secs_to_subtitle(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor((secs * 1000 % 3600000) % 60000);
  const s1 = Math.floor(s / 1000);
  const s2 = s % 1000;
  // format like "00:00:16,584"
  return `${pad2(h)}:${pad2(m)}:${pad2(s1)},${pad3(s2)}`;
}

function bilisub_to_nodes(subtitles: any): Node[] {
  return subtitles.body.map((item: any, idx: number) =>  {
    const t1 = secs_to_subtitle(item.from);
    const t2 = secs_to_subtitle(item.to);
    return {pos: String(idx+1), timestamp: `${t1} --> ${t2}`, content: item.content};
  });
}

export async function fetchBiliSubtitlesToNodes(bvId: string) {
  const { title, subtitles } = await fetchSubtitle(bvId);
  return bilisub_to_nodes(subtitles);
}
