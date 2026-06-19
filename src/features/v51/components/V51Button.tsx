import Link from "next/link";
import { Children } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./V51Button.module.css";

type ButtonTone = "primary" | "secondary" | "blueSecondary" | "danger";

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type CommonProps = {
  children: ReactNode;
  tone?: ButtonTone;
  full?: boolean;
  className?: string;
};

type LinkButtonProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  };

type NativeButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function ButtonLabel({ children }: Readonly<{ children: ReactNode }>) {
  return <span className="ua-button-label ua-inline-control-label button-label">{children}</span>;
}

function normalizeButtonChildren(children: ReactNode) {
  return Children.map(children, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      const value = String(child);

      return value.trim() ? <ButtonLabel>{child}</ButtonLabel> : child;
    }

    return child;
  });
}

export function V51LinkButton({
  children,
  tone = "secondary",
  full,
  className,
  href,
  ...props
}: LinkButtonProps) {
  return (
    <Link href={href} className={classNames("ua-inline-control", "ua-button", styles.btn, styles[tone], full && styles.full, className)} {...props}>
      {normalizeButtonChildren(children)}
    </Link>
  );
}

export function V51Button({ children, tone = "secondary", full, className, ...props }: NativeButtonProps) {
  return (
    <button className={classNames("ua-inline-control", "ua-button", styles.btn, styles[tone], full && styles.full, className)} {...props}>
      {normalizeButtonChildren(children)}
    </button>
  );
}
