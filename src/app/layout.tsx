import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Useravaa",
  description: "Production scaffold for the approved V51 Useravaa prototype."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
