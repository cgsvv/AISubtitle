import styles from '@/styles/SubtitleLine.module.css'

export default function SubTitleLine({
    timeStamp,
    content,
    translation,
}: {timeStamp: string; content: string, translation?: string})  {
    timeStamp = timeStamp.trim().slice(0, 12);
    return (
        <div className={styles.lineContainer}>
            <div className={styles.timestampBlock}>{timeStamp}</div>
            <div className={styles.contentBlock}>{content}</div>
            {/* always show translation for now 
            translation != undefined &&  */}
            <div className={styles.transBlock}>{translation || ""}</div>
        </div>     
    )
}