import Image from "next/image";
import Github from "./Github";
import { useLocalStorage } from "react-use";
import { checkOpenaiApiKey } from "@/lib/openai/openai";
import { toast } from "react-hot-toast";
import { useTranslation } from 'next-i18next';
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Header() {
    const [userKey, setUserKey] = useLocalStorage<string>("user-openai-apikey-trans");

    // note: Hydration error when use SSR, do not use localStorage for display now
    const [translateEngine, setTranslateEngine] = useState("");
    const [translateEngineStore, setTranslateEngineStore] = useLocalStorage<string>("translate-engine");

    const { t } = useTranslation("common");
    const { i18n } = useTranslation();
    const router = useRouter();
    const tooltip = "Current using " + (translateEngine === "google" ? "google translate" : "GPT") + ", Click to change";

    useEffect(() => {
        setTranslateEngine(translateEngineStore || "");
    }, [translateEngineStore]);
    
    const changeLang = () => {
        const newLang = i18n.language === "en" ? "zh-CN" : "en";

        router.push({
            pathname: router.pathname,
            query: router.query
        }, router.asPath, { locale: newLang });
    }

    const changeEngine = () => {
        const newEngine = translateEngine === "google" ? "openai" : "google";
        //setTranslateEngine(newEngine);
        setTranslateEngineStore(newEngine);
    }

    const setOpenAIKey = () => {
        const key = prompt(t("Request-Key")!);
        if (key && checkOpenaiApiKey(key)) {
            setUserKey(key);
            toast.success(t("OpenAI API key successfully set"));
        } else {
            toast.error(t("OpenAI API key is invalid"));
        }
    }

    return (
        <div style={{ margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "850px" }}>
            <div style={{ marginLeft: "10px", marginTop: "10px" }}>
                <a
                    href="https://github.com/cgsvv/AISubtitle"
                    rel="noreferrer noopener"
                    target="_blank"
                    className=""
                >
                    <Github width="33" height="33"></Github>
                </a>
                <Image title={tooltip} onClick={changeEngine} style={{ marginLeft: "20px" }} alt="settings" width={33} height={33} src={translateEngine === "google" ? "/googletran.png" : "/openai.png"} />
            </div>
            <div style={{ marginRight: "10px", marginTop: "10px" }}>
                <Image title={"Change site display language"} onClick={changeLang} style={{ marginRight: "20px" }} alt="settings" width={33} height={33} src="/trans.png" />
                <Image title={"Set your openAI key"} onClick={setOpenAIKey} alt="settings" width={33} height={33} src="/set1.png" />
            </div>
        </div>
    )
}