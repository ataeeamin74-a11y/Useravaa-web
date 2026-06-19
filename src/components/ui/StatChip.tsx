import type { ReactNode } from "react";
import { formatFaNumber } from "@/lib/fa-format";
import { UseravaaIcon, type UseravaaIconName } from "@/components/ui/UseravaaIcon";

type StatChipProps = Readonly<{
  value: number | string;
  label: string;
  icon?: UseravaaIconName;
  iconNode?: ReactNode;
  variant?: "default" | "active" | "subtle";
  className?: string;
  ariaLabel?: string;
}>;

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatStatValue(value: number | string) {
  return typeof value === "number" ? formatFaNumber(value) : formatFaNumber(value);
}

export function StatChip({ value, label, icon, iconNode, variant = "default", className, ariaLabel }: StatChipProps) {
  return (
    <span
      className={classNames("ua-stat-chip", `ua-stat-chip-${variant}`, className)}
      dir="rtl"
      aria-label={ariaLabel ?? `${formatStatValue(value)} ${label}`}
    >
      {icon ? <UseravaaIcon className="ua-stat-icon" name={icon} size={14} aria-hidden="true" /> : iconNode}
      <span className="ua-stat-value">{formatStatValue(value)}</span>
      <span className="ua-stat-label">{label}</span>
    </span>
  );
}
