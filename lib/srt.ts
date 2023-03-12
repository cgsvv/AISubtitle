import languageEncoding from "detect-file-encoding-and-language";
import { ass_to_srt } from "./ass_to_srt";
import { parseSync, formatTimestamp } from "subtitle";

export type Node = {
    pos: string;
    timestamp?: string;
    content: string;
}

export function convertToSrt(input: string): string | undefined {
    return ass_to_srt(input);
}

export function checkIsSrtFile(content: string) {
    const p1 = content.indexOf("\n");
    const r = /^\s*(\d+:\d+:\d+,\d+)[^\S\n]+-->[^\S\n]+(\d+:\d+:\d+,\d+)/;
    return r.test(content.slice(p1+1, 50));
}

export async function getEncoding(src: any) {
    const info = await languageEncoding(src);
    return info.encoding;
}

export function parseSrt(text: string) {
    const nodelist = parseSync(text);
    let idx = 1;
    const res: Node[] = [];
    for (const node of nodelist) {
        if (node.type === "cue" &&  node.data.text.trim().length > 0) {
            const t1 = formatTimestamp(node.data.start);
            const t2 = formatTimestamp(node.data.end);
            res.push({pos: String(idx), timestamp: `${t1} --> ${t2}`, content: node.data.text});
            idx++;
        }
    }
    return res;
}

function node_to_srt_text(node: Node, linesep: string): string {
    const jlst = [node.pos, node.timestamp]
    if (node.content && node.content.trim().length > 0) {
        jlst.push(node.content.trim());
    }
    return jlst.join(linesep);
}

export function nodesToSrtText(nodes: Node[], linesep="\n"): string {
    return nodes.map(node => node_to_srt_text(node, linesep)).join(linesep+linesep);
}

export function nodesToTransNodes(nodes: Node[], trans: string[], append=false, linesep="\n"): Node[] {
    return nodes.map((node, idx) => {
        const oldContent = append ? node.content + linesep: "";
        return {...node, content: oldContent + (trans[idx] || "")};
    });
}