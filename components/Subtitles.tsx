import SubTitleLine from "./SubtitleLine";
import { Node } from "@/lib/srt";

export default function Subtitles({
        nodes
    }: {nodes: Node[]}
) {
    return (
        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
            {
                nodes.map((node, index) => 
                    <SubTitleLine key={node.pos} timeStamp={node.timestamp || ""} content={node.content} />)
            }
        </div>
    )
}