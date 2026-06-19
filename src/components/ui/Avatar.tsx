"use client";

import Image from "next/image";
import { useState } from "react";
import { DEFAULT_AVATAR_SRC, DEFAULT_PROFILE_AVATAR_SRC } from "./avatar-constants";
import styles from "./Avatar.module.css";

export { DEFAULT_AVATAR_SRC, DEFAULT_PROFILE_AVATAR_SRC };

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "profile";
type AvatarShape = "circle" | "rounded";

type AvatarProps = Readonly<{
  src?: string | null;
  fallbackSrc?: string;
  alt?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}>;

const avatarPixelSizes: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  profile: 96
};

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function getAvatarSrc(src?: string | null, fallbackSrc = DEFAULT_AVATAR_SRC) {
  return src?.trim() || fallbackSrc;
}

export function Avatar({
  src,
  fallbackSrc = DEFAULT_AVATAR_SRC,
  alt = "تصویر پروفایل",
  size = "md",
  shape = "circle",
  className,
  imageClassName,
  priority
}: AvatarProps) {
  const resolvedSrc = getAvatarSrc(src, fallbackSrc);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const currentSrc = failedSrc === resolvedSrc ? fallbackSrc : resolvedSrc;
  const isFallback = currentSrc === fallbackSrc;
  const pixelSize = avatarPixelSizes[size];
  const imageModeClass = isFallback ? "ua-avatar-image--fallback" : "ua-avatar-image--photo";
  const imageModeModuleClass = isFallback ? styles.fallbackImage : styles.photoImage;

  return (
    <span
      className={classNames("ua-avatar", styles.avatar, styles[size], styles[shape], className)}
      data-avatar-mode={isFallback ? "fallback" : "photo"}
      data-fallback={isFallback ? "true" : "false"}
    >
      <Image
        className={classNames("ua-avatar-image", imageModeClass, styles.image, imageModeModuleClass, imageClassName)}
        src={currentSrc}
        alt={alt}
        width={pixelSize}
        height={pixelSize}
        priority={priority}
        unoptimized
        onError={() => {
          if (currentSrc !== fallbackSrc) {
            setFailedSrc(currentSrc);
          }
        }}
      />
    </span>
  );
}
