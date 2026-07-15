import {
  ArrowRight,
  BookOpenText,
  CaretLeft,
  Heart,
  MagnifyingGlass,
  Path,
  Scales,
  StarFour,
  X
} from "@phosphor-icons/react/ssr";

type SoftIconProps = Readonly<{
  size?: number;
  className?: string;
}>;

export function SoftChevronIcon({ size = 18, className }: SoftIconProps) {
  return <CaretLeft size={size} className={className} weight="bold" aria-hidden focusable="false" />;
}

export function SoftBackIcon({ size = 18, className }: SoftIconProps) {
  return <ArrowRight size={size} className={className} weight="bold" aria-hidden focusable="false" />;
}

export function SoftSearchIcon({ size = 22, className }: SoftIconProps) {
  return <MagnifyingGlass size={size} className={className} weight="duotone" aria-hidden focusable="false" />;
}

export function SoftCloseIcon({ size = 20, className }: SoftIconProps) {
  return <X size={size} className={className} weight="bold" aria-hidden focusable="false" />;
}

export function SoftEssentialIcon({ size = 12, className }: SoftIconProps) {
  return <StarFour size={size} className={className} weight="fill" aria-hidden focusable="false" />;
}

export function PathsTabIcon({ size = 22, className }: SoftIconProps) {
  return <Path size={size} className={className} weight="duotone" aria-hidden focusable="false" />;
}

export function CompareTabIcon({ size = 22, className }: SoftIconProps) {
  return <Scales size={size} className={className} weight="duotone" aria-hidden focusable="false" />;
}

export function SavedTabIcon({ size = 22, className }: SoftIconProps) {
  return <Heart size={size} className={className} weight="fill" aria-hidden focusable="false" />;
}

export function GuideTabIcon({ size = 22, className }: SoftIconProps) {
  return <BookOpenText size={size} className={className} weight="duotone" aria-hidden focusable="false" />;
}
