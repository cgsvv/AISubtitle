import Head from 'next/head'
import Image from 'next/image'
import { useState } from 'react';
import { getEncoding, parseSrt, Node, nodesToSrtText, checkIsSrtFile, nodesToTransNodes, convertToSrt } from '@/lib/srt';
import Subtitles from '@/components/Subtitles';
import { toast, Toaster } from "react-hot-toast";

const MAX_FILE_SIZE = 512 * 1024; // 512KB
const PAGE_SIZE = 15;
const MAX_RETRY = 5;

function download(filename: string, text: string) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function curPageNodes(nodes: Node[], curPage: number) {
    let res = nodes.slice(curPage * PAGE_SIZE, (curPage + 1) * PAGE_SIZE);
    if (res.findIndex(n => n) === -1) {
        res = [];
    }
    return res;
}

function curPageNodesText(nodes: Node[], curPage: number) {
    const curNodes = curPageNodes(nodes, curPage);
    return nodesToSrtText(curNodes);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function traslate_all(nodes: Node[], lang: string) {
    const batches: Node[][] = [];
    for (let i = 0; i < nodes.length; i += PAGE_SIZE) {
        batches.push(nodes.slice(i, i + PAGE_SIZE));
    }
    // for now, just use sequential execution
    const results: Node[] = [];
    for (const batch of batches) {
        let success = false;
        for (let i = 0; i < MAX_RETRY && !success; i++) {
            try {
                const r = await translate_one_batch(batch, lang);
                results.push(...r);
                success = true;
                console.log(`Translated ${results.length} of ${nodes.length}`);
            } catch (e) {
                console.error(e);
                await sleep(3000);   // may exceed rate limit, sleep for a while
            }
        }
        if (!success) {
            console.error(`translate_all failed for ${batch}`);
        }
    }
    return results;
}

async function translate_one_batch(nodes: Node[], lang: string) {
    let options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "targetLang": lang,
            "sentences": nodes.map(node => node.content)
        })
    };

    console.time("request /api/translate");
    const res = await fetch('/api/translate', options);
    console.timeEnd("request /api/translate");
    const jres: string[] = await res.json();
    return nodesToTransNodes(nodes, jres);
}

function clearFileInput() {
    const finput = document.getElementById("file") as HTMLInputElement;
    if (finput) {
        finput.value = "";
    }
}

export default function Srt() {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [transNodes, setTransNodes] = useState<Node[]>([]);   // make transNode the same structure as nodes
    const [curPage, setCurPage] = useState(0);

    const getLang = () => {
        return (document.getElementById("langSelect") as HTMLSelectElement).value;
    }

    const onChooseFile = async (e: any) => {
        const input = e.target;
        const f: File = input.files[0];
        if (!f) return;
        if (f.size > MAX_FILE_SIZE) {
            toast.error("Max file size 512KB");
            clearFileInput();
            return;
        }
        const encoding = await getEncoding(f);
        if (!encoding) {
            toast.error("Cannot open as text file");
            clearFileInput();
            return;
        }
        const data = await f.arrayBuffer();
        let text = new TextDecoder(encoding!).decode(data);
        if (!checkIsSrtFile(text)) {
            const converted = convertToSrt(text);
            if (converted) {
                text = converted;
            } else {
                toast.error("Cannot convert to a valid SRT file");
                clearFileInput();
                return;
            }
        }
        const nodes = parseSrt(text);
        setNodes(nodes);
        setCurPage(0);
    };

    const toPage = (delta: number) => {
        const newPage = curPage + delta;
        if (newPage < 0 || newPage >= nodes.length / PAGE_SIZE) return;
        setCurPage(newPage);
    }

    const translateFile = async () => {
        const newnodes = await traslate_all(nodes, getLang());
        download("output.srt", nodesToSrtText(newnodes));
    }

    const translate = async () => {
        const newnodes = await translate_one_batch(curPageNodes(nodes, curPage), getLang());
        setTransNodes(nodes => {
            const nodesCopy = [...nodes];
            for (let i = 0; i < PAGE_SIZE; i++) {
                nodesCopy[curPage * PAGE_SIZE + i] = newnodes[i];
            }
            return nodesCopy;
        });
    }

    const getBilibiliSub = async () => {
        let videoId = (document.getElementById("biliId") as HTMLInputElement).value;
        if (videoId && videoId.trim() != "") {
            videoId = videoId.trim();
            const resp = await fetch("/api/bili?biliId=" + videoId);
            const nodes = await resp.json() as Node[];
            setNodes(nodes);
            setCurPage(0);
        }
    }

    return (
        <>
            <Head>
                <title>srt converter</title>
            </Head>
            <main>

                <Toaster
                    position="top-center"
                    reverseOrder={false}
                    toastOptions={{ duration: 4000 }}
                />

                <select id="langSelect" style={{ width: "60px", height: "30px" }}>
                    <option value="中文">中文</option>
                    <option value="英文">英文</option>
                    <option value="日语">日语</option>
                    <option value="韩语">韩语</option>
                    <option value="西班牙语">西班牙语</option>
                </select>
                <button onClick={translate} type="button" style={{ margin: "20px", width: "60px", height: "30px" }}>translate</button>

                <div style={{ display: "flex", justifyContent: "center" }}>
                    <div style={{ display: "flex", width: "750px", flexDirection: "column", alignItems: "center" }}>
                        <input onChange={onChooseFile} type="file" accept='.srt,.ass,.txt' id="file" style={{ display: "block", margin: "30px" }} />
                        <input id="biliId" style={{ height: "30px" }}></input>
                        <button onClick={getBilibiliSub} style={{ height: "30px" }}>获取B站字幕</button>
                        <div>
                            <button onClick={() => toPage(-1)} type="button" style={{ margin: "20px", width: "60px", height: "30px" }}>prev</button>
                            <p style={{ display: "inline" }}>{curPage + 1} / {Math.ceil(nodes.length / PAGE_SIZE)}</p>
                            <button onClick={() => toPage(1)} type="button" style={{ margin: "20px", width: "60px", height: "30px" }}>next</button>
                        </div>
                        {/* <textarea value={curPageNodesText(nodes, curPage)} readOnly style={{width:"375px", height: "600px"}}></textarea> */}
                        <Subtitles nodes={curPageNodes(nodes, curPage)} transNodes={curPageNodes(transNodes, curPage)} />
                    </div>
                    {/* <div style={{width: "400px"}}>
                <select id="langSelect" style={{width: "60px", height: "30px"}}>
                    <option value="中文">中文</option>
                    <option value="英文">英文</option>
                    <option value="日语">日语</option>
                    <option value="韩语">韩语</option>
                    <option value="西班牙语">西班牙语</option>
                </select>
                <button onClick={translate} type="button" style={{margin:"20px", width: "60px", height: "30px"}}>translate</button>
                <button onClick={translateFile} type="button" style={{margin:"20px", width: "80px", height: "30px"}}>translateFile</button>
                <textarea value={srt} readOnly style={{marginTop:"108px", width:"375px", height: "600px"}}></textarea>
            </div> */}
                </div>
            </main>
        </>
    )
}