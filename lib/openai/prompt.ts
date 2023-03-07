import {Node} from "../srt"
import { OpenAIStreamPayload } from "./OpenAIResult";

// gpt返回格式为： '1\n我仍然在问自己，当我离开这个漂浮的城市时，我是否做了正确的事情。\n\n2\n我不仅指工作。'
function parse_gpt_resp(content: string) {
    const parts = content.split("\n\n");
    return parts.map(p => p.substring(p.indexOf("\n") + 1));
}

// 1\nhello\n\n
export function nodesToQueryText(nodes: Node[]) {
    return nodes.map(n => n.pos + "\n" + n.content + "\n").join("\n");
}

// 中文， 英文
function systemMessage(targetLang: string, srcLang?: string) {
    if (!srcLang) {
        return `你是一个专业的翻译。请逐行翻译下面的文本到${targetLang}，注意保留行号及换行符。`;
    } else {
        return `你是一个专业的翻译。请逐行把下面的文本从${srcLang}翻译到${targetLang}，注意保留行号及换行符。`;
    }
}

export function getPayload(nodes: Node[], targetLang: string, srcLang?: string) {
    const payload: OpenAIStreamPayload = {
        model: "gpt-3.5-turbo",
        messages: [
            {role: "system" as const, content: systemMessage(targetLang, srcLang) },
            {role: "user" as const, content: nodesToQueryText(nodes)}],
        temperature: 0,    // translate task temperature 0?
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 1024,
        stream: false,
        n: 1,
      };
      return payload;
}