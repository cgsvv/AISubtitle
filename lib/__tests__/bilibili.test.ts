import { fetchSubtitle } from "../bilibili";
import * as srt from "../srt";
import {suportedLang, suportedLangZh, commonLangZh} from "../lang";

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
}, 120 * 1000);