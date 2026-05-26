import Link from "next/link";
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

export function V51LinkButton({
  children,
  tone = "secondary",
  full,
  className,
  href,
  ...props
}: LinkButtonProps) {
  return (
    <Link href={href} className={classNames(styles.btn, styles[tone], full && styles.full, className)} {...props}>
      {children}
    </Link>
  );
}

export function V51Button({ children, tone = "secondary", full, className, ...props }: NativeButtonProps) {
  return (
    <button className={classNames(styles.btn, styles[tone], full && styles.full, className)} {...props}>
      {children}
    </button>
  );
}
