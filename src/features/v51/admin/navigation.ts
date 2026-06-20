export type AdminNavItem = {
  label: string;
  href?: string;
  description: string;
  implemented: boolean;
};

export type AdminNavGroup = {
  title: string;
  items: readonly AdminNavItem[];
};

export const adminNavigationGroups = [
  {
    title: "خانه",
    items: [
      {
        label: "صف اقدام",
        href: "/admin",
        description: "نمای عملیاتی از مواردی که همین حالا نیاز به توجه دارند.",
        implemented: true
      }
    ]
  },
  {
    title: "عملیات",
    items: [
      {
        label: "پرداخت‌ها",
        href: "/admin/payments",
        description: "بررسی پرداخت دستی و وضعیت پرداخت درخواست‌ها.",
        implemented: true
      },
      {
        label: "گفت‌وگوها",
        href: "/admin/conversations",
        description: "نمای چرخه عمر گفت‌وگو و جلسه.",
        implemented: true
      },
      {
        label: "لغوها",
        href: "/admin/cancellations",
        description: "پیگیری لغوهای نیازمند بررسی پشتیبانی.",
        implemented: true
      },
      {
        label: "حضور جلسه",
        href: "/admin/attendance",
        description: "نمای وضعیت تأیید برگزاری جلسه بدون نمایش کد خام.",
        implemented: true
      },
      {
        label: "پشتیبانی",
        href: "/admin/support",
        description: "صف پایه برای موارد نیازمند پیگیری پشتیبانی.",
        implemented: true
      }
    ]
  },
  {
    title: "افراد",
    items: [
      {
        label: "کاربران",
        href: "/admin/users",
        description: "نمای امن کاربران و آمادگی پروفایل.",
        implemented: true
      },
      {
        label: "پروفایل‌های تجربه‌آفرین",
        href: "/admin/experience-profiles",
        description: "صف بررسی و وضعیت آمادگی پروفایل تجربه‌آفرین.",
        implemented: true
      }
    ]
  },
  {
    title: "محتوا",
    items: [
      {
        label: "بینش‌ها",
        href: "/admin/insights",
        description: "نمای پایه برای وضعیت بینش‌ها.",
        implemented: true
      },
      {
        label: "مدیریت محتوا",
        href: "/admin/content",
        description: "جایگاه امن برای جریان‌های محتوایی آینده.",
        implemented: true
      },
      {
        label: "دسته‌بندی‌ها و موضوعات",
        href: "/admin/categories",
        description: "جایگاه امن برای مدیریت دسته شغلی و موضوعات.",
        implemented: true
      }
    ]
  },
  {
    title: "مالی",
    items: [
      {
        label: "دفتر تراکنش کیف پول",
        href: "/admin/wallet-transactions",
        description: "نمای خواندنی تراکنش کیف پول و پیوندهای مرتبط.",
        implemented: true
      },
      {
        label: "قیمت‌گذاری",
        href: "/admin/pricing",
        description: "قوانین قیمت‌گذاری جلسه‌ها و کمیسیون پلتفرم.",
        implemented: true
      },
      {
        label: "برداشت و تسویه در آینده",
        description: "در این چک‌پوینت کنش مالی جدید ندارد.",
        implemented: false
      }
    ]
  },
  {
    title: "تحلیل",
    items: [
      {
        label: "داشبورد",
        href: "/admin/analytics",
        description: "جایگاه امن برای گزارش‌های آینده.",
        implemented: true
      }
    ]
  },
  {
    title: "کنترل",
    items: [
      {
        label: "گزارش ممیزی",
        href: "/admin/audit-log",
        description: "نمای پایه برای تاریخچه عملیاتی.",
        implemented: true
      },
      {
        label: "تنظیمات",
        href: "/admin/settings",
        description: "جایگاه امن برای تنظیمات پنل عملیات.",
        implemented: true
      }
    ]
  }
] as const satisfies readonly AdminNavGroup[];

export const adminImplementedHrefs = adminNavigationGroups.flatMap((group) =>
  group.items.flatMap((item) => ("href" in item && item.href && item.implemented ? [item.href] : []))
);

export const adminCoreRoutePatterns = [
  "/admin",
  "/admin/payments",
  "/admin/payments/[paymentId]",
  "/admin/conversations",
  "/admin/conversations/[conversationId]",
  "/admin/cancellations",
  "/admin/cancellations/[cancellationId]",
  "/admin/users",
  "/admin/users/[userId]",
  "/admin/experience-profiles",
  "/admin/experience-profiles/[profileId]",
  "/admin/insights",
  "/admin/insights/[insightId]",
  "/admin/wallet-transactions",
  "/admin/audit-log"
] as const;

export const adminOptionalRoutePatterns = [
  "/admin/attendance",
  "/admin/analytics",
  "/admin/pricing",
  "/admin/pricing/[ruleId]",
  "/admin/content",
  "/admin/content/[contentId]",
  "/admin/categories",
  "/admin/categories/[categoryId]",
  "/admin/support",
  "/admin/support/[ticketId]",
  "/admin/settings"
] as const;

export const adminRoutePatterns = [...adminCoreRoutePatterns, ...adminOptionalRoutePatterns] as const;

export function adminHrefIsKnown(href: string) {
  if (adminRoutePatterns.includes(href as (typeof adminRoutePatterns)[number])) {
    return true;
  }

  return (
    /^\/admin\/payments\/[^/]+$/.test(href) ||
    /^\/admin\/conversations\/[^/]+$/.test(href) ||
    /^\/admin\/cancellations\/[^/]+$/.test(href) ||
    /^\/admin\/users\/[^/]+$/.test(href) ||
    /^\/admin\/experience-profiles\/[^/]+$/.test(href) ||
    /^\/admin\/insights\/[^/]+$/.test(href) ||
    /^\/admin\/pricing\/[^/]+$/.test(href) ||
    /^\/admin\/content\/[^/]+$/.test(href) ||
    /^\/admin\/categories\/[^/]+$/.test(href) ||
    /^\/admin\/support\/[^/]+$/.test(href)
  );
}
