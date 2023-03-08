import SubTitleLine from "./SubtitleLine";
import { Node } from "@/lib/srt";
import { useTranslation } from 'next-i18next';

export default function Subtitles({
        nodes,
        transNodes
    }: {nodes: Node[]; transNodes?: Node[]}) {
    const {t} = useTranslation("common");
    return (
        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
            <SubTitleLine timeStamp={t("timestamp")} translation={t("translated")!} content={t("original")} />
            {
                nodes.map((node, index) => {
                    let transText;
                    if (transNodes && transNodes.length > 0) {
                        transText = "";
                        if (transNodes[index]) transText = transNodes[index].content;
                    }
                    return <SubTitleLine key={node.pos} timeStamp={node.timestamp || ""} translation={transText} content={node.content} />;
                })
            }
        </div>
    )
}