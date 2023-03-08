import styles from '@/styles/SubtitleLine.module.css'

export default function SubTitleLine({
    timeStamp,
    content,
}: {timeStamp: string; content: string}
) {
    timeStamp = timeStamp.trim().slice(0, 12);
    return (
        <div className={styles.lineContainer}>
            <div className={styles.timestampBlock}>{timeStamp}</div>
            <div className={styles.contentBlock}>{content}</div>
        </div>
    )
}