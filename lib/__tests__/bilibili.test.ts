import { fetchSubtitle } from "../bilibili";
import * as srt from "../srt";
import {suportedLang, suportedLangZh, commonLangZh} from "../lang";
import { fetchYoutubeSubtitle, fetchYoutubeSubtitleToNodes } from "../youtube";
import { parseSync, stringifySync, formatTimestamp } from "subtitle";
import { readFileSync } from "fs";

import { parse_gpt_resp } from "../openai/prompt";

test("test", async () => {
    expect(1+2).toBe(3);

    // const text = await srt.readTextFile("/Users/cgsv/work/vtts_demo/hehe.srt");
    // const nodes = srt.parseSrt(text);
    // const text2 = srt.nodesToSrtText(nodes) + "\r\n\r\n";

    // expect(text).toBe(text2);
    console.log(commonLangZh);
    console.log(suportedLangZh.length, suportedLang.length);
    for (const lang of commonLangZh) {
        console.log(lang, suportedLang[suportedLangZh.indexOf(lang)]);
    }

    let text = readFileSync("/Users/cgsv/work/vicweb/nextjs/public/1900s.srt", "utf8");
    const res = parseSync(text);

    let r0 = res[0]

    console.log(r0, formatTimestamp(76867));

    const s = `8774
当你不知道它是什么时，
那就是爵士乐！

3422
爵士乐！

3301
你叫什么名字？
- 马克斯·图尼，先生。

5780
没错！

9751
那是我一生中最幸福的一天。

3336
所有那些人，
眼中充满希望，

1229
告别、警笛和那个
巨大的漂浮世界开始移动。

4117
感觉就像一个大型派对，
一个巨大的集市，只为我而设。

6922
但仅仅三天后，海洋
厌倦了这些庆祝活动。

8923
突然，在深夜里，
他疯狂了，一切都失控了。`
    console.log(parse_gpt_resp(s, [8774,3422,3301]))

    // const res = await fetchYoutubeSubtitleToNodes("MALGrKvXql4");
    // console.log(res);
}, 120 * 1000);