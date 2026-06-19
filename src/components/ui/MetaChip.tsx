import type { ReactNode } from "react";
import { UseravaaIcon, type UseravaaIconName } from "@/components/ui/UseravaaIcon";

type MetaChipProps = Readonly<{
  children: ReactNode;
  icon?: UseravaaIconName;
  iconSize?: number;
  className?: string;
  tone?: "default" | "selected";
}>;

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function MetaChip({ children, icon, iconSize = 16, className, tone = "default" }: MetaChipProps) {
  return (
    <span className={classNames("ua-meta-chip", tone === "selected" && "ua-meta-chip-selected", className)} dir="rtl">
      {icon ? <UseravaaIcon className="ua-meta-chip-icon" name={icon} size={iconSize} aria-hidden="true" /> : null}
      <span className="ua-meta-chip-label">{children}</span>
    </span>
  );
}
