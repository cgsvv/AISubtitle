import SubTitleLine from "./SubtitleLine";
import { Node } from "@/lib/srt";

export default function Subtitles({
        nodes,
        transNodes
    }: {nodes: Node[]; transNodes?: Node[]}) {
    return (
        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
            <SubTitleLine timeStamp={"时间戳"} translation={"译文"} content={"原文"} />
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