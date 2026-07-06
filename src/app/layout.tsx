import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://useravaa.com"),
  title: "Useravaa",
  description: "مسیرهای شغلی را با تجربه‌های واقعی بررسی، ذخیره و مقایسه کن تا تصمیم شغلی روشن‌تری بگیری.",
  manifest: "/site.webmanifest",
  robots: {
    index: false,
    follow: false
  },
  appleWebApp: {
    capable: true,
    title: "Useravaa",
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon-180x180.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#091B49"
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
