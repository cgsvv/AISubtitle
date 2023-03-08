import Head from 'next/head'
import Image from 'next/image'
import { useState } from 'react';
import { getEncoding, parseSrt, Node, nodesToSrtText, checkIsSrtFile, nodesToTransNodes, convertToSrt } from '@/lib/srt';
import Subtitles from '@/components/Subtitles';
import { toast, Toaster } from "react-hot-toast";
import styles from '@/styles/Srt.module.css';

const MAX_FILE_SIZE = 512 * 1024; // 512KB
const PAGE_SIZE = 10;
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
    const [loading, setLoading] = useState(false);

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
        setTransNodes([]);
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
        setLoading(true);
        try {
            const newnodes = await translate_one_batch(curPageNodes(nodes, curPage), getLang());
            setTransNodes(nodes => {
                const nodesCopy = [...nodes];
                for (let i = 0; i < PAGE_SIZE; i++) {
                    nodesCopy[curPage * PAGE_SIZE + i] = newnodes[i];
                }
                return nodesCopy;
            });
        } catch (e) {
            console.error("translate failed", e);
        }
        setLoading(false);
    }

    const getBiliId = (url: string) => {
        if (!url.includes("bilibili.com")) {
            toast.error("请输入哔哩哔哩视频长链接，暂不支持b23.tv或av号");
            return;
        }

        const matchResult = url.match(/\/video\/([^\/\?]+)/);
        let bvId: string | undefined;
        if (matchResult) {
            bvId = matchResult[1];
        } else {
            toast.error("暂不支持此视频链接");
        }
        return bvId;
    }

    const getBilibiliSub = async () => {
        let videoId: string | undefined = (document.getElementById("biliId") as HTMLInputElement).value;
        if (videoId && videoId.trim() != "") {
            videoId = getBiliId(videoId.trim());
            if (videoId) {
                try {
                    const resp = await fetch("/api/bili?biliId=" + videoId);
                    const nodes = await resp.json() as Node[];
                    setNodes(nodes);
                    setCurPage(0);
                    setTransNodes([]);
                } catch (e) {
                    toast.error("获取视频字幕失败");
                }      
            }
        } else {
            toast.error("请输入视频链接");
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

                <div style={{ display: "flex", justifyContent: "center", height: "100vh" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ display: "flex" }}>
                            <a href="javascript:;" className={styles.file} style={{marginLeft:"50px"}}>选择本地字幕
                                <input onChange={onChooseFile} type="file" accept='.srt,.ass,.txt' id="file" />
                            </a>
                            <input className={styles.biliInput} id="biliId" placeholder={"输入完整B站视频链接"} style={{ height: "30px", marginLeft: "150px", paddingLeft: "0px" }}></input>
                            <button onClick={getBilibiliSub} className={styles.genButton} style={{ marginLeft: "20px" }} >获取B站字幕</button>
                        </div>
                        <div style={{display: "flex", alignItems: "center"}}>
                            <button className={styles.navButton} onClick={() => toPage(-1)} type="button">上一页</button>
                            <p style={{ display: "inline-block", textAlign: "center", width: "65px" }}>{curPage + 1} / {Math.ceil(nodes.length / PAGE_SIZE)}</p>
                            <button className={styles.navButton} onClick={() => toPage(1)} type="button">下一页</button>
                            
                                <label style={{ marginRight: "10px", marginLeft: "120px" }}>目标语言</label>
                                <select className={styles.selectLang} id="langSelect">
                                    <option value="中文">中文</option>
                                    <option value="英文">英文</option>
                                    <option value="日语">日语</option>
                                    <option value="韩语">韩语</option>
                                    <option value="西班牙语">西班牙语</option>
                                </select>
                                {!loading ? <button onClick={translate} type="button" className={styles.genButton} style={{ marginLeft: "20px", height: "30px", width: "80px" }}>翻译本页</button>
                                   : <button disabled type="button" className={styles.genButton} style={{ marginLeft: "20px", height: "30px", width: "80px" }}>
                                        <div style={{display:"flex", alignItems: "center", justifyContent: "center"}}>
                                            <Image
                                                src="/loading.svg"
                                                alt="Loading..."
                                                width={20}
                                                height={20}
                                            />                  
                                        </div>
                                   </button> }

                        </div>
                        <Subtitles nodes={curPageNodes(nodes, curPage)} transNodes={curPageNodes(transNodes, curPage)} />
                    </div>
                </div>
            </main>
        </>
    )
}