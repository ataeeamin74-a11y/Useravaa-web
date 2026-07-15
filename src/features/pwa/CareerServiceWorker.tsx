"use client";

import { useEffect } from "react";

export function CareerServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/career-sw.js", { scope: "/" }).catch(() => {
      // Offline support is progressive enhancement and must not interrupt the app.
    });
  }, []);

  return null;
}
