import { secs_to_subtitle } from "./bilibili";
import { Node } from "./srt";

const SUBTITLE_DOWNLOADER_URL = "https://savesubs.com";
async function fetchYoutubeSubtitleUrls(videoId: string) {
  const response = await fetch(SUBTITLE_DOWNLOADER_URL + "/action/extract", {
    method: "POST",
    body: JSON.stringify({
      data: { url: `https://www.youtube.com/watch?v=${videoId}` },
    }),
    headers: {
      "Content-Type": "text/plain",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
      "X-Auth-Token": `${process.env.SAVESUBS_X_AUTH_TOKEN}` || "",
      "X-Requested-Domain": "savesubs.com",
      "X-Requested-With": "xmlhttprequest",
    },
  });
  const { response: json = {} } = await response.json();
  console.log("========json========", json, process.env.SAVESUBS_X_AUTH_TOKEN);
  /*
  * "title": "Microsoft vs Google: AI War Explained | tech",
    "duration": "13 minutes and 15 seconds",
    "duration_raw": "795",
    "uploader": "Joma Tech / 2023-02-20",
    "thumbnail": "//i.ytimg.com/vi/BdHaeczStRA/mqdefault.jpg",
  * */
  return { title: json.title, subtitleList: json.formats };
}

function find(subtitleList: any[] = [], args: { [key: string]: any }) {
    const key = Object.keys(args)[0];
    return subtitleList.find((item) => item[key] === args[key]);
}

export async function fetchYoutubeSubtitle(
    videoId: string,
    shouldShowTimestamp: boolean | undefined
  ) {
    const { title, subtitleList } = await fetchYoutubeSubtitleUrls(videoId);
    if (subtitleList?.length <= 0) {
      return { title, subtitlesArray: null };
    }
    const betterSubtitle =
      find(subtitleList, { quality: "zh-CN" }) ||
      find(subtitleList, { quality: "English" }) ||
      find(subtitleList, { quality: "English (auto" }) ||
      subtitleList[0];
    if (shouldShowTimestamp) {
      const subtitleUrl = `${SUBTITLE_DOWNLOADER_URL}${betterSubtitle.url}?ext=json`;
      const response = await fetch(subtitleUrl);
      const subtitles = await response.json();
      // console.log("========youtube subtitles========", subtitles);
      // const transcripts = reduceYoutubeSubtitleTimestamp(subtitles);
      const transcripts = subtitles;
      return { title, subtitlesArray: transcripts };
    }
  
    const subtitleUrl = `${SUBTITLE_DOWNLOADER_URL}${betterSubtitle.url}?ext=txt`;
    const response = await fetch(subtitleUrl);
    const subtitles = await response.text();
    const transcripts = subtitles
      .split("\r\n\r\n")
      ?.map((text: string, index: number) => ({ text, index }));
    return { title, subtitlesArray: transcripts };
  }
  
  function ytbsub_to_nodes(subtitles: any): Node[] {
    return subtitles.map((item: any, idx: number) =>  {
      const t1 = secs_to_subtitle(item.start);
      const t2 = secs_to_subtitle(item.end);
      return {pos: String(idx+1), timestamp: `${t1} --> ${t2}`, content: item.lines.join("\n") };
    });
  }

  export async function fetchYoutubeSubtitleToNodes(videoId: string) {
    const { title, subtitlesArray } = await fetchYoutubeSubtitle(videoId, true);
    const nodes = ytbsub_to_nodes(subtitlesArray);
    return nodes;
  }