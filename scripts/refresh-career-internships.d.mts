export type CareerInternshipMatchRule = Readonly<{
  slug: string;
  aliases: readonly string[];
}>;

export type ParsedCareerInternship = Readonly<{
  id: string;
  source: "jobinja" | "jobvision";
  sourceUrl: string;
  title: string;
  company: string;
  location: string;
  province?: string;
  city?: string;
  isRemote?: boolean;
  publishedAt: string;
  expiresAt?: string;
  salary?: string;
  workType?: string;
  pathSlugs: readonly string[];
}>;

export function matchCareerPathSlugs(
  title: string,
  rules: readonly CareerInternshipMatchRule[],
  fallbackSlugs?: readonly string[]
): string[];

export function parseJobinjaPage(
  html: string,
  options?: Readonly<{
    now?: Date;
    rules?: readonly CareerInternshipMatchRule[];
    fallbackSlugs?: readonly string[];
  }>
): ParsedCareerInternship[];

export function parseJobvisionResponse(
  value: unknown,
  options?: Readonly<{
    now?: Date;
    rules?: readonly CareerInternshipMatchRule[];
    fallbackSlugs?: readonly string[];
  }>
): ParsedCareerInternship[];

export function refreshCareerInternships(options?: Readonly<{
  outputPath?: string;
  now?: Date;
}>): Promise<Readonly<{
  feed: Readonly<Record<string, unknown>>;
  problems: readonly string[];
  outputPath: string;
}>>;
