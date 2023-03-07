import Head from 'next/head'
import Image from 'next/image'
import { useState } from 'react';
import { getEncoding, parseSrt, Node, nodesToSrtText, checkIsSrtFile, nodesToTransNodes } from '@/lib/srt';

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
    return nodes.slice(curPage*PAGE_SIZE, (curPage+1)*PAGE_SIZE);
}

function curPageNodesText(nodes: Node[], curPage: number) {
    const curNodes = curPageNodes(nodes, curPage);
    return nodesToSrtText(curNodes);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function traslate_all(nodes: Node[]) {
    const batches: Node[][] = [];
    for (let i = 0; i < nodes.length; i+=PAGE_SIZE) {
        batches.push(nodes.slice(i, i+PAGE_SIZE));
    }
    // for now, just use sequential execution
    const results: Node[] = [];
    for (const batch of batches) {
        let success = false;
        for (let i = 0; i < MAX_RETRY && !success; i++) {
            try {
                const r = await translate_one_batch(batch);
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

async function translate_one_batch(nodes: Node[]) {
    let options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify( {
            "targetLang":"中文",
            "sentences": nodes.map(node => node.content)
        })
    };

    const res = await fetch('/api/translate', options);
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
    const [srt, setSrt] = useState("");
    const [nodes, setNodes] = useState<Node[]>([]);
    const [curPage, setCurPage] = useState(0);

    const onChooseFile = async (e) => {
        const input = e.target;
        const f: File = input.files[0];
        if (!f) return;
        if (f.size > MAX_FILE_SIZE) {
            alert("Max file size 512KB");
            clearFileInput();
        }
        const encoding = await getEncoding(f);
        const data = await f.arrayBuffer();
        const text = new TextDecoder(encoding!).decode(data);
        if (!checkIsSrtFile(text)) {
            alert("Not a valid SRT file");
            clearFileInput();
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
        const newnodes = await traslate_all(nodes);
        download("output.srt", nodesToSrtText(newnodes));
    }

    const translate = async () => {
        const newnodes = await translate_one_batch(curPageNodes(nodes, curPage));
        setSrt(nodesToSrtText(newnodes));
    }

    return (
        <>
        <Head>
            <title>srt converter</title>
        </Head>
        <main>
            <div style={{display: "flex"}}>
            <div style={{display: "flex", height: "100vh", width: "400px", flexDirection: "column", alignItems: "center", justifyContent: "space-evenly"}}>
                <input onChange={onChooseFile} type="file" id="file" style={{display: "block", margin: "30px"}} />
                <div>
                    <button onClick={()=>toPage(-1)} type="button" style={{margin:"20px", width: "60px", height: "30px"}}>prev</button>
                    <p style={{display: "inline"}}>{curPage+1} / {Math.ceil(nodes.length / PAGE_SIZE)}</p>
                    <button onClick={() => toPage(1)} type="button" style={{margin:"20px", width: "60px", height: "30px"}}>next</button>
                </div>
                <textarea value={curPageNodesText(nodes, curPage)} readOnly style={{width:"375px", height: "600px"}}></textarea>
            </div>
            <div style={{width: "400px"}}>
                <button onClick={translate} type="button" style={{margin:"20px", width: "60px", height: "30px"}}>translate</button>
                <button onClick={translateFile} type="button" style={{margin:"20px", width: "80px", height: "30px"}}>translateFile</button>
                <textarea value={srt} readOnly style={{marginTop:"108px", width:"375px", height: "600px"}}></textarea>
            </div>
            </div>
        </main>
        </>
    )
}