import Image, { type ImageProps } from "next/image";
import styles from "./UseravaaLogo.module.css";

export type UseravaaLogoVariant = "primary" | "responsiveLarge" | "wordmark" | "symbol";

export const useravaaLogoAssets = {
  primary: {
    src: "/brand/useravaa/useravaa-primary-logo-lockup-fullcolor-transparent.png",
    width: 1303,
    height: 136
  },
  responsiveLarge: {
    src: "/brand/useravaa/useravaa-responsive-large-primary-fullcolor-transparent.png",
    width: 1303,
    height: 136
  },
  wordmark: {
    src: "/brand/useravaa/useravaa-responsive-narrow-wordmark-navy-transparent.png",
    width: 1023,
    height: 136
  },
  symbol: {
    src: "/brand/useravaa/useravaa-responsive-small-symbol-fullcolor-transparent.png",
    width: 904,
    height: 521
  }
} as const;

type UseravaaLogoProps = Omit<ImageProps, "src" | "alt" | "width" | "height"> & {
  variant?: UseravaaLogoVariant;
  alt?: string;
};

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function UseravaaLogo({ variant = "primary", alt = "Useravaa", className, ...props }: UseravaaLogoProps) {
  const asset = useravaaLogoAssets[variant];

  return (
    <Image
      {...props}
      src={asset.src}
      alt={alt}
      width={asset.width}
      height={asset.height}
      className={joinClasses(styles.logo, styles[variant], className)}
    />
  );
}
