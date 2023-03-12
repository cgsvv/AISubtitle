import { getRandomInt } from "../../utils/fp";
import {Node} from "../srt"
import { OpenAIStreamPayload } from "./OpenAIResult";

// gpt返回格式为： '1\n我仍然在问自己，当我离开这个漂浮的城市时，我是否做了正确的事情。\n\n2\n我不仅指工作。'
export function parse_gpt_resp(content: string, res_keys: number[]) {
    const lines = content.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    const positions = res_keys.map(i => lines.indexOf(String(i)));
    const res: string[] = [];
    for (let i = 0; i < positions.length; i++) {
        const p1 = positions[i];
        if (p1 === -1) {
            res.push("");
        } else {
            let next_pos: number | undefined = positions[i+1];
            if (next_pos === -1) next_pos = undefined;
            res.push(lines.slice(p1+1, next_pos).join('\n'));
        }
    }
    console.log(res);
    return res;
}

// 1\nhello\n\n
export function nodesToQueryText(nodes: Node[]) {
    return nodes.map(n => n.pos + "\n" + n.content + "\n").join("\n");
}

// 中文， 英文
function systemMessage(targetLang: string, srcLang?: string, promptTemplate?: string) {
    if (!srcLang) {
        if (promptTemplate) return promptTemplate.replace("{{target_lang}}", targetLang);
        return `你是一个专业的翻译。请逐行翻译上面的文本到${targetLang}，注意保留行号及换行符。`;
    } else {
        if (promptTemplate) return promptTemplate.replace("{{target_lang}}", targetLang).replace("{{src_lang}}", srcLang);
        return `你是一个专业的翻译。请逐行把上面的文本从${srcLang}翻译到${targetLang}，注意保留行号及换行符。`;
    }
}

const rand4 = () => getRandomInt(1000, 9999);

function rand4_n(n: number) {
    const res: number[] = [];
    for (let i = 0; i < n; i++) {
        let r = rand4();
        while (res.indexOf(r) != -1) r = rand4();
        res.push(rand4());
    }
    return res;
}

function sentences_to_nodes(sentences: string[], rands: number[]): Node[] {
    return sentences.map((sentence,idx) => {return {pos:(rands[idx]).toString(), content: sentence}});
}

export function getPayload(sentences: string[], targetLang: string, srcLang?: string, promptTemplate?: string) {
    const rands = rand4_n(sentences.length);
    const nodes = sentences_to_nodes(sentences, rands);
    const payload: OpenAIStreamPayload = {
        model: "gpt-3.5-turbo",
        messages: [
            // {role: "system" as const, content: systemMessage(targetLang, srcLang) },
            {role: "user" as const, content: nodesToQueryText(nodes) + "\n" + systemMessage(targetLang, srcLang, promptTemplate)}],
        temperature: 0,    // translate task temperature 0?
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 1024,
        stream: false,
        n: 1,
        res_keys: rands,
      };
      return payload;
}