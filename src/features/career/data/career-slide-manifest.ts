export type CareerSlide = Readonly<{
  src: string;
  alt: string;
}>;

export const MAX_CAREER_SLIDES = 15;

// The carousel stays launch-ready, but only brand-approved artwork belongs here.
// An empty manifest makes every detail page omit the slide section completely.
export const careerSlideManifest: Readonly<Record<string, readonly CareerSlide[]>> = {};

export function isCareerSlidePath(src: string, slug: string) {
  return src.startsWith(`/career-slides/${slug}/`)
    && /\/(?:0[1-9]|1[0-5])\.webp$/.test(src);
}

export function getCareerSlideSlug(pathName: string) {
  return pathName
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/&/g, " and ")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCareerSlides(pathName: string) {
  const slug = getCareerSlideSlug(pathName);
  // Only verified manifest entries are returned. An unlisted career therefore
  // receives an empty array and the carousel hides its entire slide section.
  const slides = careerSlideManifest[slug] ?? [];

  return slides
    .filter((slide) => isCareerSlidePath(slide.src, slug))
    .slice(0, MAX_CAREER_SLIDES);
}
