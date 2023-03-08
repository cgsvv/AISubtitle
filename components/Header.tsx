import Image from "next/image";
import Github from "./Github";
import { useLocalStorage } from "react-use";
import { checkOpenaiApiKey } from "@/lib/openai/openai";
import { toast, Toaster } from "react-hot-toast";

export default function Header() {
    const [userKey, setUserKey] = useLocalStorage<string>("user-openai-apikey-trans");

    const setOpenAIKey = () => {
        const key = prompt("Please enter your OpenAI API key");
        if (key && checkOpenaiApiKey(key)) {
            setUserKey(key);
            toast.success("OpenAI API key successfully set");
        } else {
            toast.error("OpenAI API key is invalid");
        }
    }

    return (
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
            <div style={{marginLeft: "10px", marginTop: "10px"}}>
                <Github width="33" height="33"></Github>
            </div>
            <div style={{marginRight: "10px", marginTop: "10px"}}>
                <Image onClick={setOpenAIKey} alt="settings" width={33} height={33} src="/set1.png" />
            </div>
        </div>
    )
}