import Link from "next/link";

export default function Footer() {
    return (
        <footer style={{display: "flex", alignItems: "center", justifyContent: "center", marginTop:"20px", fontSize: "18px", color: "rgb(148, 163, 184)"}}>
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