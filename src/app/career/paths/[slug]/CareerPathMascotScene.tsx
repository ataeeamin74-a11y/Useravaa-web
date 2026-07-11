import Image from "next/image";
import {
  careerPathVisualAssetExists,
  getCareerPathVisualAssetPath,
  type CareerPathVisualSlot
} from "@/features/career/career-path-visual-assets";
import type { CareerPathVisualProfile } from "@/features/career/career-path-visuals";
import styles from "./CareerPathSeoPage.module.css";

type CareerPathImageSlotProps = Readonly<{
  slug: string;
  profile: CareerPathVisualProfile;
  slot: CareerPathVisualSlot;
  alt: string;
  priority?: boolean;
  hero?: boolean;
}>;

function CareerPathImageSlot({
  slug,
  profile,
  slot,
  alt,
  priority = false,
  hero = false
}: CareerPathImageSlotProps) {
  const src = getCareerPathVisualAssetPath(slug, slot);
  const hasImage = careerPathVisualAssetExists(slug, slot);

  return (
    <figure
      className={hero ? styles.heroImageSlot : styles.sectionImageSlot}
      data-career-image-slot={slot}
      data-section-visual={slot === "heroMascot" ? undefined : slot}
      data-expected-src={src}
      data-has-image={hasImage ? "true" : "false"}
      data-scene={profile.sceneType}
    >
      {hasImage ? (
        <Image
          className={styles.imageSlotMedia}
          src={src}
          alt={alt}
          width={1600}
          height={900}
          sizes={hero ? "(min-width: 980px) 640px, 100vw" : "(min-width: 980px) 1040px, 100vw"}
          priority={priority}
        />
      ) : (
        <div className={styles.imageSlotPlaceholder} aria-hidden="true">
          <span className={styles.placeholderCard} data-card="1">{profile.propLabels[0]}</span>
          <span className={styles.placeholderCard} data-card="2">{profile.propLabels[1]}</span>
          <span className={styles.placeholderCard} data-card="3">{profile.propLabels[2]}</span>
          <span className={styles.placeholderPath} />
        </div>
      )}
    </figure>
  );
}

export function CareerPathHeroMascot({
  slug,
  pathTitle,
  profile
}: Readonly<{
  slug: string;
  pathTitle: string;
  profile: CareerPathVisualProfile;
}>) {
  return (
    <div className={styles.heroVisual} data-career-mascot-scene={profile.sceneType}>
      <CareerPathImageSlot
        slug={slug}
        profile={profile}
        slot="heroMascot"
        alt={`تصویر ماسکات مسیر ${pathTitle}`}
        priority
        hero
      />
    </div>
  );
}

export function CareerPathSectionImage({
  slug,
  profile,
  slot,
  alt
}: Readonly<{
  slug: string;
  pathTitle: string;
  profile: CareerPathVisualProfile;
  slot: Exclude<CareerPathVisualSlot, "heroMascot">;
  alt: string;
}>) {
  return (
    <CareerPathImageSlot
      slug={slug}
      profile={profile}
      slot={slot}
      alt={alt}
    />
  );
}
