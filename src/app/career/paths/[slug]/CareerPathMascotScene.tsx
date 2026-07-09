import Image from "next/image";
import { CAREER_PATH_MASCOT_IMAGE_SRC, type CareerPathVisualProfile } from "@/features/career/career-path-visuals";
import styles from "./CareerPathSeoPage.module.css";

type CareerPathMascotSceneProps = Readonly<{
  pathTitle: string;
  profile: CareerPathVisualProfile;
  compact?: boolean;
}>;

export function CareerPathMascotScene({ pathTitle, profile, compact = false }: CareerPathMascotSceneProps) {
  return (
    <figure
      className={compact ? styles.mascotSceneCompact : styles.mascotScene}
      data-career-mascot-scene={profile.sceneType}
      data-scene={profile.sceneType}
      data-accent={profile.accent}
    >
      <div className={styles.sceneProps} aria-hidden="true">
        {profile.propLabels.map((label, index) => (
          <span className={styles.sceneProp} data-prop-index={index + 1} key={label}>{label}</span>
        ))}
        <span className={styles.sceneConnector} />
      </div>
      <Image
        className={styles.mascotImage}
        src={CAREER_PATH_MASCOT_IMAGE_SRC}
        alt={`راهنمای تصویری Useravaa برای مسیر شغلی ${pathTitle}`}
        width={312}
        height={312}
        priority={!compact}
      />
      <figcaption className={styles.mascotCaption}>
        <span>{profile.insightLabel}</span>
        <strong>{profile.sceneCaption}</strong>
      </figcaption>
    </figure>
  );
}
