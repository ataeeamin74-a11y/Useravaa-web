"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  BriefcaseBusiness,
  MessageCircleQuestion,
  TriangleAlert,
  UserRoundCheck,
  type CareerIcon
} from "@/features/career/CareerIcons";
import styles from "./CareerPathSeoPage.module.css";

const sectionItems: readonly Readonly<{
  id: string;
  label: string;
  icon: CareerIcon;
}>[] = [
  { id: "career-path-fit", label: "مناسب منه؟", icon: UserRoundCheck },
  { id: "career-path-realities", label: "واقعیت‌ها", icon: BriefcaseBusiness },
  { id: "career-path-hardships", label: "سختی‌ها", icon: TriangleAlert },
  { id: "career-path-intelligence", label: "هوش مصنوعی", icon: Bot },
  { id: "career-path-interview", label: "مصاحبه", icon: MessageCircleQuestion }
];

export function CareerPathSectionNav() {
  const [activeSection, setActiveSection] = useState(sectionItems[0].id);

  useEffect(() => {
    const sections = sectionItems
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section));
    if (!sections.length || !("IntersectionObserver" in window)) return undefined;

    const observer = new IntersectionObserver((entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
      if (visibleEntry?.target.id) setActiveSection(visibleEntry.target.id);
    }, { rootMargin: "-18% 0px -62%", threshold: [0.05, 0.25, 0.5] });

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className={styles.sectionNav} aria-label="دسترسی سریع به بخش‌های مسیر شغلی">
      <div className={styles.sectionNavRail}>
        {sectionItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <a
              className={isActive ? styles.sectionNavLinkActive : styles.sectionNavLink}
              href={`#${item.id}`}
              aria-current={isActive ? "location" : undefined}
              key={item.id}
              onClick={(event) => {
                const section = document.getElementById(item.id);
                if (!section) return;

                event.preventDefault();
                const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                section.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
                window.history.replaceState(null, "", `#${item.id}`);
                setActiveSection(item.id);
              }}
            >
              <Icon size={15} aria-hidden="true" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
