import languageEncoding from "detect-file-encoding-and-language";
// import * as fs from "fs";

export type Node = {
    pos: string;
    timestamp?: string;
    content: string;
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

export function getLineSeparator(src: string) {
    return src.slice(0, 500).indexOf("\r\n") >= 0 ? "\r\n" : "\n";
}

function block_to_node(block: string, linesep: string): Node | undefined {
    try {
        const [pos, timestamp, ...rest] = block.split(linesep);
        if (timestamp && timestamp.trim() !==  "") {
            return {pos, timestamp, content: rest.join(linesep)};
        }
    } catch (e) {
    }
}

export function parseSrt(text: string) {
    text = text.replaceAll("\r", "");
    const linesep = "\n";
    const blocks = text.split(linesep+linesep);
    const nodes: Node[] = [];
    for (const block of blocks) {
        const node = block_to_node(block, linesep);
        if (node) nodes.push(node);
    }
    return nodes;
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

// export async function readTextFile(src: string) {
//     const encoding = await getEncoding(src);
//     const data = fs.readFileSync(src);
//     const s = new TextDecoder(encoding!).decode(data);
//     return s;
// }