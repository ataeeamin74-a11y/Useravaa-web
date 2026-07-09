"use client";

import { useEffect } from "react";
import { trackCareerEvent } from "./career-events";

function getCareerEntrySource(pathname: string) {
  if (pathname === "/") return "root";
  if (pathname === "/career") return "career";
  return "unknown";
}

export function CareerEventBootstrap() {
  useEffect(() => {
    trackCareerEvent("career_entry", {
      source: getCareerEntrySource(window.location.pathname)
    });
  }, []);

  return null;
}
