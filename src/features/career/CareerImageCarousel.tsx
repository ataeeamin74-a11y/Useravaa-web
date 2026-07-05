"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, UIEvent } from "react";
import { SoftCloseIcon } from "./CareerSoftIcons";
import type { CareerSlide } from "./data/career-slide-manifest";
import { MAX_CAREER_SLIDES } from "./data/career-slide-manifest";
import styles from "./CareerPages.module.css";

type CareerImageCarouselProps = Readonly<{
  slides: readonly CareerSlide[];
}>;

function getClosestSlideIndex(carousel: HTMLElement) {
  const carouselRect = carousel.getBoundingClientRect();
  const carouselCenter = carouselRect.left + carouselRect.width / 2;
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  Array.from(carousel.children).forEach((slide, index) => {
    const slideRect = slide.getBoundingClientRect();
    const slideCenter = slideRect.left + slideRect.width / 2;
    const distance = Math.abs(slideCenter - carouselCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

export function CareerImageCarousel({ slides }: CareerImageCarouselProps) {
  const visibleSlides = slides.length > MAX_CAREER_SLIDES
    ? slides.slice(0, MAX_CAREER_SLIDES)
    : slides;
  const carouselRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const viewerRef = useRef<HTMLDialogElement>(null);
  const viewerCarouselRef = useRef<HTMLDivElement>(null);
  const viewerFrameRef = useRef<number | undefined>(undefined);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const openingSlideIndexRef = useRef(0);
  const returnFocusIndexRef = useRef(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [activeViewerSlideIndex, setActiveViewerSlideIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => () => {
    if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    if (viewerFrameRef.current !== undefined) cancelAnimationFrame(viewerFrameRef.current);
  }, []);

  useEffect(() => {
    if (!viewerOpen) return;

    const viewer = viewerRef.current;
    if (viewer && !viewer.open) viewer.showModal();

    const frame = requestAnimationFrame(() => {
      const slide = viewerCarouselRef.current?.children.item(openingSlideIndexRef.current);
      if (slide instanceof HTMLElement) {
        slide.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" });
      }
      closeButtonRef.current?.focus({ preventScroll: true });
    });

    return () => cancelAnimationFrame(frame);
  }, [viewerOpen]);

  useEffect(() => {
    if (!viewerOpen) return;

    const bodyOverflow = document.body.style.overflow;
    const documentOverflow = document.documentElement.style.overflow;
    const bodyOverscrollBehavior = document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = documentOverflow;
      document.body.style.overscrollBehavior = bodyOverscrollBehavior;
    };
  }, [viewerOpen]);

  // Missing slides are an expected launch state, not an error or placeholder.
  if (!visibleSlides.length) return null;

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const carousel = event.currentTarget;

    if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      setActiveSlideIndex(getClosestSlideIndex(carousel));
      frameRef.current = undefined;
    });
  }

  function handleViewerScroll(event: UIEvent<HTMLDivElement>) {
    const carousel = event.currentTarget;

    if (viewerFrameRef.current !== undefined) cancelAnimationFrame(viewerFrameRef.current);
    viewerFrameRef.current = requestAnimationFrame(() => {
      setActiveViewerSlideIndex(getClosestSlideIndex(carousel));
      viewerFrameRef.current = undefined;
    });
  }

  function showSlide(index: number) {
    const slide = carouselRef.current?.children.item(index);
    if (!(slide instanceof HTMLElement)) return;

    slide.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  function openViewer(index: number) {
    openingSlideIndexRef.current = index;
    returnFocusIndexRef.current = index;
    setActiveViewerSlideIndex(index);
    setViewerOpen(true);
  }

  function closeViewer() {
    const trigger = triggerRefs.current[returnFocusIndexRef.current];
    setViewerOpen(false);
    requestAnimationFrame(() => trigger?.focus());
  }

  function handleViewerBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) closeViewer();
  }

  function handleViewerKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeViewer();
      return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => element.tabIndex >= 0);

    if (!focusableElements.length) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <section className={styles.careerSlideSection} data-career-image-carousel aria-label="تصاویر مسیر شغلی">
      <div
        className={styles.careerSlideRail}
        ref={carouselRef}
        onScroll={handleScroll}
        tabIndex={0}
        aria-label="گالری تصاویر مسیر شغلی"
      >
        {visibleSlides.map((slide, index) => (
          <figure className={styles.careerSlide} data-career-slide={index + 1} key={slide.src}>
            <button
              type="button"
              className={styles.careerSlideButton}
              aria-label={`نمایش تمام‌صفحه تصویر ${index + 1}: ${slide.alt}`}
              onClick={() => openViewer(index)}
              ref={(element) => {
                triggerRefs.current[index] = element;
              }}
            >
              <Image
                className={styles.careerSlideImage}
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="(min-width: 768px) 270px, 76vw"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </button>
          </figure>
        ))}
      </div>

      <div className={styles.careerSlideStatus}>
        <div className={styles.careerSlideDots} aria-label="انتخاب تصویر">
          {visibleSlides.map((slide, index) => (
            <button
              type="button"
              className={index === activeSlideIndex ? styles.careerSlideDotActive : styles.careerSlideDot}
              aria-label={`نمایش تصویر ${index + 1}`}
              aria-current={index === activeSlideIndex ? "true" : undefined}
              onClick={() => showSlide(index)}
              key={slide.src}
            />
          ))}
        </div>
        <span className={styles.careerSlideCounter} dir="ltr" aria-live="polite">
          {activeSlideIndex + 1} / {visibleSlides.length}
        </span>
      </div>

      {viewerOpen ? (
        <dialog
          className={styles.careerViewer}
          data-career-viewer
          ref={viewerRef}
          aria-label="نمایش تمام‌صفحه تصاویر مسیر شغلی"
          aria-modal="true"
          onCancel={(event) => {
            event.preventDefault();
            closeViewer();
          }}
          onClick={handleViewerBackdropClick}
          onKeyDown={handleViewerKeyDown}
        >
          <div className={styles.careerViewerToolbar}>
            <span className={styles.careerViewerCounter} dir="ltr" aria-live="polite">
              {activeViewerSlideIndex + 1} / {visibleSlides.length}
            </span>
            <button
              type="button"
              className={styles.careerViewerClose}
              aria-label="بستن نمایش تمام‌صفحه"
              onClick={closeViewer}
              ref={closeButtonRef}
            >
              <SoftCloseIcon size={22} />
            </button>
          </div>

          <div
            className={styles.careerViewerRail}
            ref={viewerCarouselRef}
            onScroll={handleViewerScroll}
            tabIndex={0}
            aria-label="تصاویر تمام‌صفحه مسیر شغلی"
          >
            {visibleSlides.map((slide, index) => (
              <figure className={styles.careerViewerSlide} data-career-viewer-slide={index + 1} key={slide.src}>
                <span className={styles.careerViewerImageFrame}>
                  <Image
                    className={styles.careerViewerImage}
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    sizes="(min-width: 768px) min(70vw, 720px), 92vw"
                    loading={index === activeViewerSlideIndex ? "eager" : "lazy"}
                  />
                </span>
              </figure>
            ))}
          </div>
        </dialog>
      ) : null}
    </section>
  );
}
