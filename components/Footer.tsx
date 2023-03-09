import Link from "next/link";

export default function Footer() {
    return (
        <footer style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginTop:"20px", marginBottom: "10px", paddingLeft:"20px", paddingRight:"20px", fontSize: "18px", color: "rgb(148, 163, 184)"}}>
            <div>
                <a
                    href="/zhifu.png"
                    target="_blank"
                    rel="noreferrer"
                >
                    <b>
                    Support Me
                    </b>
                </a>
            </div>
            <div>
                Thanks to{" "}
                <a
                    href="https://openai.com/"
                    target="_blank"
                    rel="noreferrer"
                >
                    <b>
                    OpenAI{" "}
                    </b>
                </a>
                and{" "}
                <a
                    href="https://vercel.com/"
                    target="_blank"
                    rel="noreferrer"
                >
                    <b>
                    Vercel Edge Functions.
                    </b>
                </a>
            </div>
        </footer>
    )
}