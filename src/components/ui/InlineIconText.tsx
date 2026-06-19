import type { ReactNode } from "react";
import { UseravaaIcon, type UseravaaIconName } from "@/components/ui/UseravaaIcon";

type InlineIconTextProps = Readonly<{
  icon: UseravaaIconName;
  children: ReactNode;
  iconSize?: number;
  className?: string;
}>;

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function InlineIconText({ icon, children, iconSize = 17, className }: InlineIconTextProps) {
  return (
    <span className={classNames("ua-inline-icon-text", className)} dir="rtl">
      <UseravaaIcon className="ua-inline-icon-text-icon" name={icon} size={iconSize} aria-hidden="true" />
      <span className="ua-inline-icon-text-label">{children}</span>
    </span>
  );
}
