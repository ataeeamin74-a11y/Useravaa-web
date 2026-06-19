import styles from "./RequestSentIllustration.module.css";

type RequestSentIllustrationProps = {
  className?: string;
};

export function RequestSentIllustration({ className }: RequestSentIllustrationProps) {
  return (
    <div className={`${styles.illustration} ${className ?? ""}`} aria-hidden="true" data-testid="request-sent-illustration">
      <svg className={styles.connector} viewBox="0 0 420 176" role="presentation" focusable="false">
        <defs>
          <linearGradient id="request-sent-connector" x1="360" y1="58" x2="76" y2="124" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--teal)" />
            <stop offset="100%" stopColor="var(--blue)" />
          </linearGradient>
        </defs>
        <path d="M356 80 C 292 34, 188 38, 122 100 C 104 117, 88 126, 66 128" fill="none" stroke="url(#request-sent-connector)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="66" cy="128" r="20" className={styles.sentNodeSvg} data-illustration-part="request-sent-node" />
        <path d="M57 128.5 L64 135 L78 119" fill="none" stroke="var(--blue)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <div className={`${styles.profileCard} ${styles.requestCard}`} data-illustration-part="request-card">
        <span className={styles.cardBadge} />
        <span className={styles.cardLineLong} />
        <span className={styles.cardLineShort} />
      </div>

      <div className={`${styles.profileCard} ${styles.providerCard}`} data-illustration-part="provider-card">
        <span className={styles.avatarDot} />
        <span className={styles.cardLineLong} />
        <span className={styles.cardLineShort} />
      </div>

      <div className={styles.timeCapsules}>
        <span className={styles.timeCapsule} data-illustration-part="pending-time-capsule">
          زمان ۱
        </span>
        <span className={styles.timeCapsule} data-illustration-part="pending-time-capsule">
          زمان ۲
        </span>
        <span className={styles.timeCapsule} data-illustration-part="pending-time-capsule">
          زمان ۳
        </span>
      </div>

      <div className={styles.waitingCard}>
        <span className={styles.waitingDot} />
        <span>در انتظار پیشنهاد زمان</span>
      </div>
    </div>
  );
}
