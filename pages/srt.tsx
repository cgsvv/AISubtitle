import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react';
import { useSearchParams } from "next/navigation";
import { getEncoding, parseSrt, Node, nodesToSrtText, checkIsSrtFile, nodesToTransNodes, convertToSrt } from '@/lib/srt';
import Subtitles from '@/components/Subtitles';
import { toast, Toaster } from "react-hot-toast";
import styles from '@/styles/Srt.module.css';
import { useTranslation } from 'next-i18next';
import {suportedLang, suportedLangZh, commonLangZh, langBiMap} from '@/lib/lang';
import getVideoId from 'get-video-id';
import { useLocalStorage } from 'react-use';
import { ENABLE_SHOP } from '@/utils/constants';

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

async function traslate_all(nodes: Node[], lang: string, apiKey?: string, notifyResult?: any, useGoogle?: boolean, promptTemplate?: string) {
    const batches: Node[][] = [];
    for (let i = 0; i < nodes.length; i += PAGE_SIZE) {
        batches.push(nodes.slice(i, i + PAGE_SIZE));
    }
    // for now, just use sequential execution
    const results: Node[] = [];
    let batch_num = 0;
    for (const batch of batches) {
        let success = false;
        for (let i = 0; i < MAX_RETRY && !success; i++) {
            try {
                const r = await translate_one_batch(batch, lang, apiKey, useGoogle, promptTemplate);
                results.push(...r);
                success = true;
                if (notifyResult) {
                    notifyResult(batch_num, r);
                }
                console.log(`Translated ${results.length} of ${nodes.length}`);
            } catch (e) {
                console.error(e);
                await sleep(3000);   // may exceed rate limit, sleep for a while
            }
        }
        batch_num++;
        if (!success) {
            console.error(`translate_all failed for ${batch}`);
            throw new Error(`translate file ${batch} failed`);
        }
    }
    return results;
}

async function translate_one_batch(nodes: Node[], lang: string, apiKey?: string, useGoogle?: boolean, promptTemplate?: string) {
    const sentences = nodes.map(node => node.content);
    // if last sentence ends with ",", remove it
    const lastSentence = sentences[sentences.length - 1];
    if (lastSentence.endsWith(",") || lastSentence.endsWith("，")) {
        sentences[sentences.length - 1] = lastSentence.substring(0, lastSentence.length - 1);
    }

    let options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "targetLang": lang,
            "sentences": sentences,
            "apiKey": apiKey,
            "promptTemplate": promptTemplate
        })
    };

    console.time("request /api/translate");
    const url = useGoogle ? '/api/googleTran': '/api/translate';
    const res = await fetch(url, options);
    console.timeEnd("request /api/translate");

    if (res.redirected) {
        if (ENABLE_SHOP) {
            window.location.href = res.url;
            throw new Error(" redirected");
        } else {
            throw new Error(" rate limited. Please enter you OpenAI key");
        }
    }

    const jres = await res.json();
    if (jres.errorMessage) {
        throw new Error(jres.errorMessage);
    }
    return nodesToTransNodes(nodes, jres);
}

function clearFileInput() {
    const finput = document.getElementById("file") as HTMLInputElement;
    if (finput) {
        finput.value = "";
    }
}

type TranslateFileStatus = {
    isTranslating: boolean,
    transCount: number,
}

export default function Srt() {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [transNodes, setTransNodes] = useState<Node[]>([]);   // make transNode the same structure as nodes
    const [curPage, setCurPage] = useState(0);
    const [filename, setFilename] = useState("");
    const [loading, setLoading] = useState(false);
    const [transFileStatus, setTransFileStatus] = useState<TranslateFileStatus>({isTranslating: false, transCount: 0});
    const [showAllLang, setShowAllLang] = useState(false);
    const {t} = useTranslation("common");
    const langs = showAllLang ? suportedLangZh : commonLangZh;
    const isEnglish = t("English") === "English";

    // handle licence key
    const searchParams = useSearchParams();
    const licenceKey = searchParams.get("licence_key");
    const [userLicenceKey, setUserLicenceKey] = useLocalStorage<string>("user-license-key");
    useEffect(() => { licenceKey && setUserLicenceKey(licenceKey);}, [licenceKey]);

    const getUseGoogle = () => {
        const res =  localStorage.getItem("translate-engine");
        if (res) {
            return JSON.parse(res) === "google";
        }
        return false;
    }

    const getUserKey = () => {
        const res =  localStorage.getItem("user-openai-apikey-trans");
        if (res) return JSON.parse(res) as string;
        else return userLicenceKey;
    }

    const getUserPrompt = () => {
        const res =  localStorage.getItem("user-prompt-template");
        if (res) return res;
    }

    const getLang = () => {
        return (document.getElementById("langSelect") as HTMLSelectElement).value;
    }

    const onNewSubtitleText = (text: string, fname: string) => {
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
        setFilename(fname);
    }

    useEffect(() => {
        (async () => {
            const resp = await fetch('/1900s.srt');
            const text = await resp.text();
            onNewSubtitleText(text, '1900 (Movie) example');
        })();
    }, []);

    const onChooseFile = async (e: any) => {
        const input = e.target;
        const f: File = input.files[0];
        if (!f) return;
        if (f.size > MAX_FILE_SIZE) {
            toast.error(t("Max file size 512KB"));
            clearFileInput();
            return;
        }
        const encoding = await getEncoding(f);
        if (!encoding) {
            toast.error(t("Cannot open as text file"));
            clearFileInput();
            return;
        }
        const data = await f.arrayBuffer();
        let text = new TextDecoder(encoding!).decode(data);
        onNewSubtitleText(text, f.name);
    };

    const toPage = (delta: number) => {
        const newPage = curPage + delta;
        if (newPage < 0 || newPage >= nodes.length / PAGE_SIZE) return;
        setCurPage(newPage);
    }

    const on_trans_result = (batch_num: number, tnodes: Node[]) => {
        setTransFileStatus(old => {return {...old, transCount: batch_num+1}});
        setTransNodes(nodes => {
            const nodesCopy = [...nodes];
            for (let i = 0; i < PAGE_SIZE; i++) {
                nodesCopy[batch_num * PAGE_SIZE + i] = tnodes[i];
            }
            return nodesCopy;
        });
    }

    const translateFile = async () => {
        setTransFileStatus({isTranslating: true, transCount: 0});
        try {
            const newnodes = await traslate_all(nodes, getLang(), getUserKey(), on_trans_result, getUseGoogle(), getUserPrompt());
            //download("output.srt", nodesToSrtText(newnodes));
            toast.success(t("translate file successfully"));
        } catch (e) {
            toast.error(t("translate file failed ") + String(e));
        }
        setTransFileStatus(old => {return {...old, isTranslating: false}});
    }

    const translate = async () => {
        setLoading(true);
        try {
            const newnodes = await translate_one_batch(curPageNodes(nodes, curPage), getLang(), getUserKey(), getUseGoogle(), getUserPrompt());
            setTransNodes(nodes => {
                const nodesCopy = [...nodes];
                for (let i = 0; i < PAGE_SIZE; i++) {
                    nodesCopy[curPage * PAGE_SIZE + i] = newnodes[i];
                }
                return nodesCopy;
            });
        } catch (e) {
            console.error("translate failed", e);
            toast.error(t("translate failed") + String(e));
        }
        setLoading(false);
    }

    const getBiliId = (url: string) => {
        if (!url.includes("bilibili.com")) {
            //toast.error(t("Input bilibili video full url"));
            return;
        }

        const matchResult = url.match(/\/video\/([^\/\?]+)/);
        let bvId: string | undefined;
        if (matchResult) {
            bvId = matchResult[1];
        } else {
            //toast.error(t("do not support this video url"));
        }
        return bvId;
    }


    const getBilibiliSub = async () => {
        const videoUrl: string | undefined = (document.getElementById("biliId") as HTMLInputElement).value;
        let videoId: string | undefined = videoUrl;
        if (videoId && videoId.trim() != "") {
            videoId = getBiliId(videoId.trim());
            let isYoutube = false;
            if (!videoId) {
                // try youtube
                const res = getVideoId(videoUrl);
                if (res.service === "youtube") {videoId = res.id!; isYoutube = true; }
            }

            if (videoId) {
                try {
                    const resp = await fetch("/api/bili?biliId=" + videoId + "&service=" + (isYoutube? "youtube" : "bilibili"));
                    const nodes = await resp.json() as Node[];
                    setNodes(nodes);
                    setCurPage(0);
                    setTransNodes([]);
                } catch (e) {
                    toast.error(t("Get video subtitle failed"));
                }
            } else {
                toast.error(t("Input Youtube/Bilibili video full url"));
            }
        } 
    }

    const download_original = () => {
        download("original.srt", nodesToSrtText(nodes));
    }

    const download_translated = () => {
        const nodes = transNodes.filter(n => n);
        download("translated.srt", nodesToSrtText(nodes));
    }

    const get_page_count = () => Math.ceil(nodes.length / PAGE_SIZE);

    return (
        <>
            <Head>
                <title>{t("AI-Subtilte")}</title>
            </Head>
            <main style={{minHeight: "90vh"}}>
                <Toaster
                    position="top-center"
                    reverseOrder={false}
                    toastOptions={{ duration: 4000 }}
                />
                <div className={styles.welcomeMessage}>
                    {t('Welcome')}
                </div>

                <div style={{ display: "flex", margin: "0 auto", paddingTop: "30px", justifyContent: "center",  maxWidth: "900px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ display: "flex" }}>
                            <a href="#!" className={styles.file} style={{ marginLeft: "50px" }}>{t("select-local-sub")}
                                <input onChange={onChooseFile} type="file" accept='.srt,.ass,.txt' id="file" />
                            </a>
                            <input className={styles.biliInput} id="biliId" placeholder={t("Bili-Url")!} style={{ height: "30px", marginLeft: "150px", paddingLeft: "0px" }}></input>
                            <button onClick={getBilibiliSub} className={styles.genButton} style={{ marginLeft: "20px" }} >{t("Bili-Get-Sub")}</button>
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <button className={styles.navButton} onClick={() => toPage(-1)} type="button">{t('prev')}</button>
                            <p style={{ display: "inline-block", textAlign: "center", width: "65px" }}>{curPage + 1} / {Math.ceil(nodes.length / PAGE_SIZE)}</p>
                            <button className={styles.navButton} onClick={() => toPage(1)} type="button">{t('next')}</button>

                            <label style={{ marginRight: "10px", marginLeft: "120px" }}>{t("targetLang")}</label>
                            <select className={styles.selectLang} id="langSelect">
                                {langs.map(lang => <option key={lang} value={lang}>{isEnglish? langBiMap.get(lang) : lang}</option>)}
                            </select>
                            <input type="checkbox" title={t("Show All languages")!} style={{ marginLeft: "5px" }} checked={showAllLang} onChange={e => setShowAllLang(e.target.checked)}></input>
                            {!loading ? <button onClick={translate} type="button" title={t("API-Slow-Warn")!} className={styles.genButton} style={{ marginLeft: "5px", height: "30px", width: "80px" }}>{t("Translate-This")}</button>
                                : <button disabled type="button" className={styles.genButton} style={{ marginLeft: "20px", height: "30px", width: "80px" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Image
                                            src="/loading.svg"
                                            alt="Loading..."
                                            width={20}
                                            height={20}
                                        />
                                    </div>
                                </button>}

                        </div>
                        <div style={{color: "gray"}}>{filename ? filename : t("No subtitle selected") }</div>
                        <Subtitles nodes={curPageNodes(nodes, curPage)} transNodes={curPageNodes(transNodes, curPage)} />
                        <div style={{width: "100%", display: "flex", justifyContent: "flex-end", marginTop: "20px", marginRight: "50px" }}>
                            {!transFileStatus.isTranslating ? <button onClick={translateFile} className={styles.genButton} style={{ height: "30px", marginRight: "20px", width: "120px" }}>{t("Translate-File")}</button> :
                                <button onClick={translateFile} disabled className={styles.genButton} style={{ height: "30px", marginRight: "20px", width: "120px" }}>
                                    <Image src="/loading.svg" alt="Loading..." width={20} height={20} />
                                    {t("Progress")}{transFileStatus.transCount}/{get_page_count()}
                                    </button>
                            }
                            <button onClick={download_original} className={styles.genButton} style={{ height: "30px", marginRight: "20px" }}>{t("Download-Original")}</button>
                            <button onClick={download_translated} className={styles.genButton} style={{ height: "30px" }}>{t("Download-Translated")}</button>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}