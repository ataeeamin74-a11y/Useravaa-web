export type AppEnvironment = "local" | "development" | "staging" | "production";

const appEnvironments = new Set<AppEnvironment>(["local", "development", "staging", "production"]);

function normalizeAppEnvironment(value?: string | null): AppEnvironment | null {
  const normalized = value?.trim().toLowerCase();

  if (appEnvironments.has(normalized as AppEnvironment)) {
    return normalized as AppEnvironment;
  }

  return null;
}

export function getAppEnvironment(source: NodeJS.ProcessEnv = process.env): AppEnvironment {
  const explicitEnvironment = normalizeAppEnvironment(source.APP_ENV);

  if (explicitEnvironment) {
    return explicitEnvironment;
  }

  if (source.VERCEL_ENV === "production") {
    return "production";
  }

  if (source.VERCEL_ENV === "preview") {
    return "staging";
  }

  if (source.NODE_ENV === "production") {
    return "staging";
  }

  if (source.NODE_ENV === "test") {
    return "local";
  }

  return "development";
}

export function isSiteIndexingEnabled(source: NodeJS.ProcessEnv = process.env) {
  return getAppEnvironment(source) === "production" && source.USERAVAA_SITE_INDEXING === "1";
}

export function shouldEnableStrictTransportSecurity(source: NodeJS.ProcessEnv = process.env) {
  return getAppEnvironment(source) === "production" && source.USERAVAA_ENABLE_HSTS === "1";
}

export function getSitemapUrl(source: NodeJS.ProcessEnv = process.env) {
  if (!source.APP_BASE_URL) {
    return undefined;
  }

  try {
    return new URL("/sitemap.xml", source.APP_BASE_URL).toString();
  } catch {
    return undefined;
  }
}

export function getRobotsPolicy(source: NodeJS.ProcessEnv = process.env) {
  if (isSiteIndexingEnabled(source)) {
    return {
      indexingEnabled: true,
      rules: {
        userAgent: "*",
        allow: "/"
      }
    } as const;
  }

  return {
    indexingEnabled: false,
    rules: {
      userAgent: "*",
      disallow: "/"
    }
  } as const;
}
