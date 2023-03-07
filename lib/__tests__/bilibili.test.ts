import { fetchSubtitle } from "../bilibili";
import * as srt from "../srt";

test("test", async () => {
    expect(1+2).toBe(3);

    const text = await srt.readTextFile("/Users/cgsv/work/vtts_demo/hehe.srt");
    const nodes = srt.parseSrt(text);
    const text2 = srt.nodesToSrtText(nodes) + "\r\n\r\n";

    expect(text).toBe(text2);
}, 120 * 1000);