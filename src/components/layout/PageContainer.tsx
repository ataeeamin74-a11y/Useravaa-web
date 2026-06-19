import type { ReactNode } from "react";
import styles from "./PageContainer.module.css";

export type PageContainerVariant = "guide" | "dashboard" | "marketplace" | "flow" | "empty";

type PageContainerProps = Readonly<{
  children: ReactNode;
  variant: PageContainerVariant;
  as?: "div" | "main" | "section";
  className?: string;
}>;

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function PageContainer({ children, variant, as: Component = "div", className }: PageContainerProps) {
  return <Component className={cx(styles.container, styles[variant], className)}>{children}</Component>;
}
