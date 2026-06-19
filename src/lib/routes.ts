export type RouteId =
  | "discover"
  | "insights"
  | "guide"
  | "profileDetail"
  | "requests"
  | "requestNew"
  | "sessions"
  | "actions"
  | "conversations"
  | "conversationDetail"
  | "proposeTimes"
  | "selectTime"
  | "checkout"
  | "profile"
  | "profileBuild"
  | "profileNetwork"
  | "profileFeedback"
  | "profileSettings"
  | "settings"
  | "saved"
  | "wallet"
  | "notifications";

export type AppRoute = {
  id: RouteId;
  href: string;
  title: string;
  summary: string;
  requiredApi: string;
  primaryActions: readonly string[];
  states: readonly string[];
};

export const appRoutes = [
  {
    id: "discover",
    href: "/discover",
    title: "کشف تجربه‌ها",
    summary: "کشف آدم‌های دارای تجربه مرتبط با جستجو، چهار فیلتر اصلی، ذخیره تجربه و ورود به پروفایل.",
    requiredApi: "GET /api/profiles; POST/DELETE save",
    primaryActions: ["submit_search", "filter", "open_profile", "save"],
    states: ["loading", "empty", "error", "loaded", "no_results"]
  },
  {
    id: "insights",
    href: "/insights",
    title: "بینش‌ها",
    summary: "صفحه editorial theme-first برای خواندن بینش‌های کوتاه تجربه‌محور، ذخیره بینش و ورود به پروفایل تجربه.",
    requiredApi: "GET /api/insights; POST /api/insight-questions",
    primaryActions: ["filter_inline", "save_insight", "download_preview", "open_profile", "load_more", "answer_weekly_question"],
    states: ["loaded", "filtered", "download_preview", "empty"]
  },
  {
    id: "guide",
    href: "/guide",
    title: "راهنما",
    summary: "راهنمای Useravaa با CTAهای رفتن به کشف تجربه‌ها و ساخت پروفایل تجربه.",
    requiredApi: "none",
    primaryActions: ["go_to_discover", "go_to_build_profile"],
    states: ["loaded"]
  },
  {
    id: "profileDetail",
    href: "/profiles/[profileId]",
    title: "پروفایل تجربه",
    summary: "نمای عمومی پروفایل تجربه، قیمت‌ها، CTA درخواست ۳۰ دقیقه و ۱ ساعت و بینش‌های منتشرشده.",
    requiredApi: "GET /api/profiles/{profileId}; POST save",
    primaryActions: ["request_30", "request_60", "save", "report"],
    states: ["loading", "error", "loaded", "inactive_profile"]
  },
  {
    id: "requests",
    href: "/requests",
    title: "درخواست‌ها",
    summary: "نمای مستقل مدیریت درخواست‌های جلسه مشاوره برای درخواست‌های دریافتی و ارسال‌شده.",
    requiredApi: "GET /api/conversations",
    primaryActions: ["switch_sent_received", "primary_state_action", "open_detail"],
    states: ["loading", "empty", "error", "loaded", "needs_action", "tracking", "done"]
  },
  {
    id: "requestNew",
    href: "/requests/new",
    title: "درخواست جلسه مشاوره",
    summary: "انتخاب مدت جلسه مشاوره و ثبت درخواست اولیه برای پروفایل انتخاب‌شده.",
    requiredApi: "GET profile; POST /api/conversations",
    primaryActions: ["submit_request", "cancel"],
    states: ["loaded", "validation_error", "submitting"]
  },
  {
    id: "conversations",
    href: "/conversations",
    title: "جلسه‌ها",
    summary: "درخواست‌های پرداخت‌شده، زمان‌های پیشنهادی و هماهنگی جلسه‌های قطعی‌شده.",
    requiredApi: "GET /api/conversations",
    primaryActions: ["switch_sent_received", "primary_state_action", "open_detail"],
    states: ["loading", "empty", "error", "loaded", "needs_action", "tracking", "done"]
  },
  {
    id: "sessions",
    href: "/sessions",
    title: "جلسه‌ها",
    summary: "نمای مستقل پیگیری درخواست‌های پرداخت‌شده، زمان‌های پیشنهادی و وضعیت جلسه‌های قطعی‌شده.",
    requiredApi: "GET /api/conversations",
    primaryActions: ["switch_sent_received", "primary_state_action", "open_detail"],
    states: ["loading", "empty", "error", "loaded", "needs_action", "tracking", "done"]
  },
  {
    id: "actions",
    href: "/actions",
    title: "اقدام‌ها",
    summary: "صندوق اقدام‌های لازم برای ادامه مسیر درخواست‌ها، جلسه‌ها، پرداخت، پروفایل و کیف پول.",
    requiredApi: "GET /api/conversations; GET account/profile/wallet readiness",
    primaryActions: ["filter_actions", "open_task", "open_detail"],
    states: ["loaded", "filtered", "empty"]
  },
  {
    id: "conversationDetail",
    href: "/conversations/[conversationId]",
    title: "جزئیات جلسه",
    summary: "نمای وضعیت محور جلسه مشاوره، تایم‌لاین و CTAهای وابسته به state machine.",
    requiredApi: "GET conversation; state action endpoints",
    primaryActions: ["propose_times", "select_time", "cancel", "feedback"],
    states: ["loading", "error", "loaded", "state_specific"]
  },
  {
    id: "proposeTimes",
    href: "/conversations/[conversationId]/propose-times",
    title: "پیشنهاد سه زمان",
    summary: "انتخاب دقیقاً سه زمان پیشنهادی و ارسال زمان‌ها برای طرف مقابل.",
    requiredApi: "POST proposed-times",
    primaryActions: ["select_date", "select_time", "remove_time", "submit"],
    states: ["empty_selection", "invalid_count", "valid_selection", "submitting"]
  },
  {
    id: "selectTime",
    href: "/conversations/[conversationId]/select-time",
    title: "انتخاب زمان",
    summary: "انتخاب یکی از زمان‌های پیشنهادی برای قطعی‌شدن جلسه مشاوره.",
    requiredApi: "POST select-time",
    primaryActions: ["select_proposed_time", "cancel"],
    states: ["loading", "no_options", "loaded", "submitting"]
  },
  {
    id: "checkout",
    href: "/checkout/[conversationId]",
    title: "پرداخت امن درخواست جلسه",
    summary: "مرور درخواست، بررسی موجودی کیف پول و پرداخت امن پیش از ارسال درخواست برای صاحب تجربه.",
    requiredApi: "POST checkout; POST confirm payment",
    primaryActions: ["confirm_payment", "top_up", "cancel"],
    states: ["wallet_sufficient", "requires_gateway", "processing", "failed", "paid"]
  },
  {
    id: "profile",
    href: "/profile",
    title: "پروفایل من",
    summary: "داشبورد پروفایل تجربه، شبکه حرفه‌ای، بازخوردها، تنظیمات و کیف پول.",
    requiredApi: "GET me/profile/network/stats",
    primaryActions: ["edit_profile", "open_network", "open_feedback", "open_settings", "open_wallet"],
    states: ["no_profile", "pending_review", "needs_changes", "active", "inactive"]
  },
  {
    id: "profileBuild",
    href: "/profile/build",
    title: "ساخت پروفایل تجربه",
    summary: "رفتار profile builder شامل آواتار، پیش‌نویس، پیش‌نمایش و ارسال برای بررسی.",
    requiredApi: "POST draft; POST submit",
    primaryActions: ["upload_avatar", "save_draft", "preview", "submit_for_review"],
    states: ["draft", "invalid", "valid", "submitting", "pending_review"]
  },
  {
    id: "profileNetwork",
    href: "/profile/network",
    title: "ذخیره‌شده‌ها",
    summary: "نمای ذخیره‌شده‌های پروفایل با جست‌وجو و فیلتر.",
    requiredApi: "GET /api/network",
    primaryActions: ["search", "filter", "sort", "open_profile", "remove_save"],
    states: ["loading", "empty", "error", "loaded", "large_list"]
  },
  {
    id: "saved",
    href: "/saved",
    title: "ذخیره‌شده‌ها",
    summary: "نمای تجربه‌ها و بینش‌های ذخیره‌شده با وضعیت محلی و fixture-only.",
    requiredApi: "local storage; future GET /api/saved",
    primaryActions: ["open_profile", "remove_saved_experience", "remove_saved_insight"],
    states: ["empty", "loaded"]
  },
  {
    id: "profileFeedback",
    href: "/profile/feedback",
    title: "بازخوردهای دریافتی",
    summary: "بازخوردهایی که بعد از جلسه‌های مشاوره برای تجربه کاربر ثبت شده‌اند.",
    requiredApi: "GET /api/feedback/received",
    primaryActions: ["view_feedback"],
    states: ["loading", "empty", "error", "loaded"]
  },
  {
    id: "profileSettings",
    href: "/profile/settings",
    title: "تنظیمات حساب",
    summary: "تنظیمات حساب، اطلاعات تسویه، حریم خصوصی و اعلان‌ها.",
    requiredApi: "GET/PUT account; PUT settlement-info",
    primaryActions: ["edit_account", "edit_settlement", "privacy_toggle", "notification_toggle"],
    states: ["loaded", "validation_error", "saved"]
  },
  {
    id: "settings",
    href: "/settings",
    title: "تنظیمات حساب",
    summary: "مسیر ریشه تنظیمات حساب که به سطح تنظیمات پروفایل متصل است.",
    requiredApi: "GET/PUT account; PUT settlement-info",
    primaryActions: ["edit_account", "edit_settlement", "privacy_toggle", "notification_toggle"],
    states: ["redirect", "loaded", "validation_error", "saved"]
  },
  {
    id: "wallet",
    href: "/wallet",
    title: "کیف پول و پرداخت‌ها",
    summary: "موجودی، پرداخت‌ها، درآمد، اطلاعات تسویه و درخواست برداشت.",
    requiredApi: "GET wallet; top-up; payout",
    primaryActions: ["top_up", "request_payout", "edit_settlement", "filter_transactions"],
    states: ["loading", "empty", "error", "loaded", "missing_settlement_info"]
  },
  {
    id: "notifications",
    href: "/notifications",
    title: "اعلان‌ها",
    summary: "لیست اعلان‌ها، وضعیت خوانده‌نشده و باز کردن اعلان مرتبط با مسیر.",
    requiredApi: "GET notifications; POST read",
    primaryActions: ["open_notification", "mark_read"],
    states: ["loading", "empty", "error", "loaded"]
  }
] as const satisfies readonly AppRoute[];

export const mainNavigation = [
  { href: "/discover", label: "کشف تجربه‌ها", routeIds: ["discover"] },
  { href: "/insights", label: "بینش‌ها", routeIds: ["insights"] },
  {
    href: "/conversations",
    label: "جلسه‌ها",
    routeIds: ["conversations", "conversationDetail", "proposeTimes", "selectTime", "checkout", "requestNew", "requests", "sessions", "actions"]
  },
  { href: "/guide", label: "راهنما", routeIds: ["guide"] }
] as const;

export const utilityNavigation = [
  { href: "/notifications", label: "اعلان‌ها", routeIds: ["notifications"], variant: "link", badge: "۳" },
  { href: "/saved", label: "ذخیره‌شده‌ها", routeIds: ["saved"], variant: "link" },
  { href: "/wallet", label: "کیف پول", routeIds: ["wallet"], variant: "link" },
  { href: "/guide", label: "راهنما", routeIds: ["guide"], variant: "link" }
] as const;

export function getRouteById(routeId: RouteId): AppRoute {
  const route = appRoutes.find((item) => item.id === routeId);

  if (!route) {
    throw new Error(`Unknown route id: ${routeId}`);
  }

  return route;
}

export function getRouteIdByPathname(pathname: string): RouteId | undefined {
  if (pathname.startsWith("/profiles/")) {
    return "profileDetail";
  }

  if (pathname === "/requests/new") {
    return "requestNew";
  }

  if (pathname.startsWith("/conversations/") && pathname.endsWith("/propose-times")) {
    return "proposeTimes";
  }

  if (pathname.startsWith("/conversations/") && pathname.endsWith("/select-time")) {
    return "selectTime";
  }

  if (pathname.startsWith("/conversations/")) {
    return "conversationDetail";
  }

  if (pathname === "/checkout" || pathname.startsWith("/checkout/")) {
    return "checkout";
  }

  const exactRoute = appRoutes.find((route) => route.href === pathname);

  if (exactRoute) {
    return exactRoute.id;
  }

  if (pathname.startsWith("/profile/")) {
    return "profile";
  }

  return undefined;
}
