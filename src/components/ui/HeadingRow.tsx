import type { ReactNode } from "react";
import { UseravaaIcon, type UseravaaIconName } from "@/components/ui/UseravaaIcon";

type HeadingRowProps = Readonly<{
  icon: UseravaaIconName;
  title: ReactNode;
  level?: 1 | 2 | 3;
  id?: string;
  className?: string;
}>;

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function HeadingRow({ icon, title, level = 1, id, className }: HeadingRowProps) {
  const TitleTag = `h${level}` as const;

  return (
    <header className={classNames("ua-heading-row", className)} dir="rtl">
      <span className="ua-heading-icon-wrap">
        <UseravaaIcon className="ua-heading-icon" name={icon} aria-hidden="true" />
      </span>
      <TitleTag className="ua-heading-title" id={id}>
        {title}
      </TitleTag>
    </header>
  );
}
