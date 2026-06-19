import styles from "./ConfirmedSessionIllustration.module.css";

type ConfirmedSessionIllustrationProps = {
  selectedTimeLabel?: string;
  className?: string;
};

export function ConfirmedSessionIllustration({ selectedTimeLabel = "زمان ۲", className }: ConfirmedSessionIllustrationProps) {
  return (
    <div className={`${styles.illustration} ${className ?? ""}`} aria-hidden="true" data-testid="confirmed-session-illustration">
      <svg className={styles.connector} viewBox="0 0 420 180" role="presentation" focusable="false">
        <defs>
          <linearGradient id="confirmed-session-connector" x1="70" y1="42" x2="350" y2="138" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--teal)" />
            <stop offset="100%" stopColor="var(--blue)" />
          </linearGradient>
        </defs>
        <path d="M72 92 C 144 26, 236 150, 348 82" fill="none" stroke="url(#confirmed-session-connector)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="348" cy="82" r="22" className={styles.successNodeSvg} data-illustration-part="success-node" />
        <path d="M338 82.5 L345 89 L359 74" fill="none" stroke="var(--blue)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <div className={`${styles.profileCard} ${styles.profileRequester}`} data-illustration-part="profile-card">
        <span className={styles.avatarDot} />
        <span className={styles.cardLineLong} />
        <span className={styles.cardLineShort} />
      </div>

      <div className={`${styles.profileCard} ${styles.profileProvider}`} data-illustration-part="profile-card">
        <span className={styles.avatarDot} />
        <span className={styles.cardLineLong} />
        <span className={styles.cardLineShort} />
      </div>

      <div className={styles.timeCapsules}>
        <span className={styles.timeCapsule} data-illustration-part="time-capsule">
          زمان ۱
        </span>
        <span className={`${styles.timeCapsule} ${styles.timeCapsuleSelected}`} data-illustration-part="time-capsule" data-selected="true">
          {selectedTimeLabel}
        </span>
        <span className={styles.timeCapsule} data-illustration-part="time-capsule">
          زمان ۳
        </span>
      </div>

      <div className={styles.sessionMiniCard} data-illustration-part="session-mini-card">
        <strong>جلسه قطعی</strong>
        <span>{selectedTimeLabel}</span>
      </div>
    </div>
  );
}
