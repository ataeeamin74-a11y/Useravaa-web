import type { Metadata } from "next";
import Link from "next/link";
import styles from "./DevPages.module.css";

export const metadata: Metadata = {
  title: "بررسی صفحات Useravaa"
};

type QaRoute = Readonly<{
  title: string;
  href: string;
  note: string;
}>;

type QaGroup = Readonly<{
  title: string;
  description: string;
  routes: readonly QaRoute[];
}>;

type MissingRoute = Readonly<{
  title: string;
  path: string;
  note: string;
}>;

const dynamicSampleRoutes = {
  // Fixture profile id from src/features/v51/data/profiles.ts.
  publicProfileAli: "/profiles/ali",
  // Fixture profile id from src/features/v51/data/profiles.ts.
  publicProfileSara: "/profiles/sara",
  // Published insight slug from src/features/v51/data/experience-discovery.ts.
  insightDetailAli: "/insights/active-question-product-ambiguity-ali",
  // Conversation fixture id from src/features/v51/data/conversations.ts.
  conversationTimeOptions: "/conversations/conv-time-options",
  // Conversation fixture id from src/features/v51/data/conversations.ts.
  proposeTimesProviderRequest: "/conversations/conv-provider-request/propose-times",
  // Conversation fixture id from src/features/v51/data/conversations.ts.
  selectTimeOptions: "/conversations/conv-time-options/select-time",
  // Conversation fixture id from src/features/v51/data/conversations.ts.
  checkoutAwaitingPayment: "/checkout/conv-awaiting-payment"
} as const;

const routeGroups: readonly QaGroup[] = [
  {
    title: "صفحات اصلی محصول",
    description: "مسیرهای اصلی قابل مرور برای جریان کشف، بینش، داشبورد و مدیریت جلسه‌ها.",
    routes: [
      {
        title: "کشف تجربه‌ها",
        href: "/discover",
        note: "فیلترهای جستجو، کارت‌های تجربه و CTA درخواست جلسه را بررسی کن."
      },
      {
        title: "بینش‌ها",
        href: "/insights",
        note: "هدر فشرده، سؤال جدید، فیلترها و کارت‌های عمومی بینش را بررسی کن."
      },
      {
        title: "پروفایل من",
        href: "/profile",
        note: "بنر مدیریت پروفایل، گرید داشبورد، بینش‌های من و کارت‌های کناری را ببین."
      },
      {
        title: "درخواست‌ها",
        href: "/requests",
        note: "نمای مستقل مدیریت درخواست‌های جلسه مشاوره با همان داده و اکشن‌های گفت‌وگوها."
      },
      {
        title: "جلسه‌ها",
        href: "/sessions",
        note: "نمای مستقل جلسه‌های مشاوره، زمان‌های پیشنهادی، پرداخت و وضعیت‌های پیگیری."
      }
    ]
  },
  {
    title: "حساب کاربری",
    description: "ورود، ثبت‌نام و مسیرهای حساب که در محصول فعلی وجود دارند.",
    routes: [
      {
        title: "ورود",
        href: "/login",
        note: "حالت مهمان و مسیر ورود به حساب را بررسی کن."
      },
      {
        title: "ثبت‌نام",
        href: "/register",
        note: "ثبت‌نام بدون اجبار به انتخاب نقش provider/seeker را بررسی کن."
      },
      {
        title: "تنظیمات حساب",
        href: "/settings",
        note: "مسیر ریشه تنظیمات حساب که به سطح تنظیمات پروفایل متصل می‌شود."
      },
      {
        title: "کیف پول",
        href: "/wallet",
        note: "موجودی، تراکنش‌ها، برداشت و اطلاعات تسویه را مرور کن."
      },
      {
        title: "ذخیره‌شده‌ها",
        href: "/saved",
        note: "تب افراد ذخیره‌شده و بینش‌های ذخیره‌شده را بررسی کن."
      }
    ]
  },
  {
    title: "پروفایل و تجربه",
    description: "نمونه‌های عمومی و مسیرهای ساخت یا ویرایش پروفایل تجربه.",
    routes: [
      {
        title: "پروفایل عمومی نمونه: علی",
        href: dynamicSampleRoutes.publicProfileAli,
        note: "نمای عمومی پروفایل، تجربه‌های کاری، قیمت جلسه و بینش‌ها را ببین."
      },
      {
        title: "پروفایل عمومی نمونه: سارا",
        href: dynamicSampleRoutes.publicProfileSara,
        note: "نمونه دوم برای بررسی تنوع داده و کارت‌های پروفایل عمومی."
      },
      {
        title: "ساخت یا ویرایش پروفایل تجربه",
        href: "/profile/build",
        note: "فرم تکمیل پروفایل، انتخاب شرکت‌های قابل نمایش و سؤال مخاطب را بررسی کن."
      },
      {
        title: "بازخوردهای دریافت‌شده",
        href: "/profile/feedback",
        note: "نمای بازخوردها و کپی بدون پیام کمبود داده را بررسی کن."
      },
      {
        title: "شبکه و ذخیره‌شده‌های پروفایل",
        href: "/profile/network",
        note: "نمای قدیمی‌تر شبکه/ذخیره‌شده‌ها را برای رگرسیون مرور کن."
      }
    ]
  },
  {
    title: "بینش‌ها",
    description: "مسیرهای عمومی و مالکانه بینش برای مرور انتشار، مدیریت و جزئیات.",
    routes: [
      {
        title: "فهرست بینش‌ها",
        href: "/insights",
        note: "کارت‌های عمومی نباید اکشن دانلود/کپی برای بینش دیگران داشته باشند."
      },
      {
        title: "جریان پاسخ به سؤال جدید",
        href: "/insights?answer=active",
        note: "مودال پاسخ، شمارنده 280، انتخاب چندگانه مخاطب و موفقیت داخل همان مودال را بررسی کن."
      },
      {
        title: "جزئیات بینش نمونه",
        href: dynamicSampleRoutes.insightDetailAli,
        note: "مسیر مستقیم یک بینش منتشرشده با اسلاگ واقعی fixture."
      },
      {
        title: "مدیریت بینش‌های من",
        href: "/profile/insights",
        note: "اکشن‌های مالکانه مثل دانلود تصویر کارت، کپی لینک، ویرایش و برداشتن از انتشار را بررسی کن."
      }
    ]
  },
  {
    title: "درخواست، جلسه و پرداخت",
    description: "نمونه‌های مهم state machine برای درخواست جلسه و پرداخت.",
    routes: [
      {
        title: "درخواست جلسه برای علی",
        href: "/requests/new?profileId=ali&duration=30",
        note: "فرم درخواست ۳۰ دقیقه‌ای برای یک پروفایل واقعی fixture."
      },
      {
        title: "جزئیات درخواست نمونه",
        href: dynamicSampleRoutes.conversationTimeOptions,
        note: "یک درخواست با گزینه‌های زمانی برای بررسی حالت جزئیات."
      },
      {
        title: "پیشنهاد زمان",
        href: dynamicSampleRoutes.proposeTimesProviderRequest,
        note: "حالت provider برای پیشنهاد چند زمان جلسه."
      },
      {
        title: "انتخاب زمان",
        href: dynamicSampleRoutes.selectTimeOptions,
        note: "حالت requester برای انتخاب یکی از زمان‌های پیشنهادی."
      },
      {
        title: "پرداخت جلسه",
        href: dynamicSampleRoutes.checkoutAwaitingPayment,
        note: "صفحه پرداخت و نهایی‌سازی جلسه با شناسه fixture."
      }
    ]
  },
  {
    title: "وضعیت‌های خالی و مرزی",
    description: "Query-stateهای واقعی که routeها همین حالا می‌خوانند و برای QA دستی مفیدند.",
    routes: [
      {
        title: "پروفایل بدون ساخته‌شدن",
        href: "/profile?state=none",
        note: "حالت بدون پروفایل تجربه و CTA شروع ساخت پروفایل."
      },
      {
        title: "پروفایل ناقص",
        href: "/profile?state=draft",
        note: "حالت تکمیل‌نشده برای بررسی چک‌لیست و CTA تکمیل."
      },
      {
        title: "پروفایل در انتظار بررسی",
        href: "/profile?state=pending_review",
        note: "حالت ارسال‌شده برای بررسی."
      },
      {
        title: "پروفایل نیازمند اصلاح",
        href: "/profile?state=needs_changes",
        note: "حالت نیازمند اصلاح برای بررسی کپی و CTA."
      },
      {
        title: "پروفایل فعال",
        href: "/profile?state=active",
        note: "حالت فعال برای بررسی بنر و ماژول‌های داشبورد."
      },
      {
        title: "پروفایل غیرفعال",
        href: "/profile?state=inactive",
        note: "حالت توقف دریافت درخواست‌ها یا غیرفعال‌بودن پروفایل."
      },
      {
        title: "ذخیره‌شده‌ها: افراد",
        href: "/saved?tab=people",
        note: "تب افراد ذخیره‌شده با segmented tab."
      },
      {
        title: "ذخیره‌شده‌ها: بینش‌ها",
        href: "/saved?tab=insights",
        note: "تب بینش‌های ذخیره‌شده با active state مستقل."
      }
    ]
  }
];

const missingRoutes: readonly MissingRoute[] = [
  {
    title: "حالت logged-out با query",
    path: "auth=guest",
    note: "toggle سراسری mock/auth برای مهمان وجود ندارد؛ مسیرهای /login و /register قابل بررسی‌اند."
  },
  {
    title: "حالت بدون بینش با query",
    path: "/insights?state=empty",
    note: "route فعلی فقط query پاسخ فعال را می‌خواند و empty state مستقل ندارد."
  },
  {
    title: "حالت بدون درخواست با query",
    path: "/conversations?state=empty",
    note: "route فعلی state خالی را از query نمی‌خواند."
  }
];

function RouteCard({ route }: Readonly<{ route: QaRoute }>) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <h3>{route.title}</h3>
        <span className={styles.path}>{route.href}</span>
      </div>
      <p className={styles.note}>{route.note}</p>
      <Link className={styles.link} href={route.href}>
        باز کردن
      </Link>
    </article>
  );
}

export default function DevPagesRoute() {
  return (
    <main className={styles.page} dir="rtl">
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Internal QA</span>
        <h1>بررسی صفحات Useravaa</h1>
        <p>
          این صفحه فقط برای QA دستی ساخته شده و وارد ناوبری محصول نمی‌شود. لینک‌ها بر اساس routeهای واقعی App Router و
          شناسه‌های fixture موجود تنظیم شده‌اند.
        </p>
      </header>

      <div className={styles.content}>
        {routeGroups.map((group) => (
          <section className={styles.group} key={group.title}>
            <div className={styles.groupHeader}>
              <h2>{group.title}</h2>
              <p>{group.description}</p>
            </div>
            <div className={styles.grid}>
              {group.routes.map((route) => (
                <RouteCard key={`${group.title}-${route.href}-${route.title}`} route={route} />
              ))}
            </div>
          </section>
        ))}

        <section className={`${styles.group} ${styles.missing}`}>
          <div className={styles.groupHeader}>
            <h2>هنوز پیاده‌سازی نشده</h2>
            <p>این موارد در درخواست QA مهم بودند، اما route واقعی برایشان در کد فعلی وجود ندارد.</p>
          </div>
          <div className={styles.grid}>
            {missingRoutes.map((route) => (
              <article className={styles.missingCard} key={`${route.path}-${route.title}`}>
                <span className={styles.badge}>پیاده‌سازی نشده</span>
                <div className={styles.cardHeader}>
                  <h3>{route.title}</h3>
                  <span className={styles.path}>{route.path}</span>
                </div>
                <p className={styles.note}>{route.note}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
