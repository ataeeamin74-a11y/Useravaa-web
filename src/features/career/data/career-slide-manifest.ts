export type CareerSlide = Readonly<{
  src: string;
  alt: string;
}>;

export const MAX_CAREER_SLIDES = 15;

export const careerSlideManifest: Readonly<Record<string, readonly CareerSlide[]>> = {
  "بازاریابی-محتوا": [
    {
      src: "/career-slides/بازاریابی-محتوا/01.webp",
      alt: "اینفوگرافیک معرفی بازاریابی محتوا و نقش آن در ارتباط با مخاطب"
    },
    {
      src: "/career-slides/بازاریابی-محتوا/02.webp",
      alt: "اینفوگرافیک ویژگی‌های فردی مناسب برای مسیر بازاریابی محتوا"
    },
    {
      src: "/career-slides/بازاریابی-محتوا/03.webp",
      alt: "اینفوگرافیک مهارت‌ها و اصول کلیدی موفقیت در بازاریابی محتوا"
    },
    {
      src: "/career-slides/بازاریابی-محتوا/04.webp",
      alt: "اینفوگرافیک مزایا و فرصت‌های مسیر شغلی بازاریابی محتوا"
    },
    {
      src: "/career-slides/بازاریابی-محتوا/05.webp",
      alt: "اینفوگرافیک نقش هوش مصنوعی در آینده بازاریابی محتوا"
    }
  ],
  "طراحی-محصول-و-تجربه-کاربری-ui-ux": [
    {
      src: "/career-slides/طراحی-محصول-و-تجربه-کاربری-ui-ux/01.webp",
      alt: "اینفوگرافیک معرفی طراحی محصول و فرایند طراحی رابط و تجربه کاربری"
    },
    {
      src: "/career-slides/طراحی-محصول-و-تجربه-کاربری-ui-ux/02.webp",
      alt: "اینفوگرافیک ویژگی‌های فردی مناسب برای مسیر طراحی رابط و تجربه کاربری"
    },
    {
      src: "/career-slides/طراحی-محصول-و-تجربه-کاربری-ui-ux/03.webp",
      alt: "اینفوگرافیک چالش‌های شغلی طراحی رابط و تجربه کاربری"
    },
    {
      src: "/career-slides/طراحی-محصول-و-تجربه-کاربری-ui-ux/04.webp",
      alt: "اینفوگرافیک مزایا و فرصت‌های مسیر شغلی طراحی رابط و تجربه کاربری"
    },
    {
      src: "/career-slides/طراحی-محصول-و-تجربه-کاربری-ui-ux/05.webp",
      alt: "اینفوگرافیک نقش هوش مصنوعی در آینده طراحی رابط و تجربه کاربری"
    }
  ]
};

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
