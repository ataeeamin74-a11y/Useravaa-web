import { V51LinkButton } from "@/features/v51/components/V51Button";
import styles from "./GuidePage.module.css";

const productRows = [
  {
    number: "۱",
    title: "آدم مناسب را پیدا کن",
    body: "براساس نقش، حوزه شغلی، رده سازمانی و شرکت‌ها."
  },
  {
    number: "۲",
    title: "پروفایل تجربه را ببین",
    body: "سابقه، حوزه کاری، شرکت‌ها، رضایت و مسیر حرفه‌ای."
  },
  {
    number: "۳",
    title: "درخواست جلسه مشاوره بده",
    body: "طرف مقابل زمان پیشنهاد می‌دهد؛ تو یکی را انتخاب می‌کنی."
  }
];

const audienceRows = [
  {
    title: "در حال انتخاب مسیر",
    body: "می‌خواهی قبل از انتخاب نقش یا حوزه کاری، تجربه آدم‌های واقعی را ببینی."
  },
  {
    title: "در حال رشد",
    body: "می‌خواهی بفهمی چند قدم جلوتر در مسیرت چه خبر است."
  },
  {
    title: "در حال تغییر مسیر",
    body: "می‌خواهی قبل از تغییر، تجربه مسیر جدید را از نزدیک‌تر بشناسی."
  }
];

const discoverFlow = [
  {
    number: "۱",
    title: "جستجو و فیلتر",
    body: "نقش، حوزه شغلی، رده سازمانی، شرکت و سابقه."
  },
  {
    number: "۲",
    title: "دیدن پروفایل تجربه",
    body: "اطلاعات کافی برای انتخاب آدم مناسب."
  },
  {
    number: "۳",
    title: "درخواست جلسه مشاوره",
    body: "وقتی پروفایل به تصمیم تو نزدیک بود."
  }
];

const offerFlow = [
  {
    number: "۱",
    title: "پروفایل تجربه بساز",
    body: "نقش، رده سازمانی، حوزه شغلی، سابقه و قیمت جلسه مشاوره."
  },
  {
    number: "۲",
    title: "در کشف تجربه‌ها نمایش داده شو",
    body: "بعد از تأیید، پروفایلت در کشف تجربه‌ها نمایش داده می‌شود."
  },
  {
    number: "۳",
    title: "درخواست‌ها را مدیریت کن",
    body: "اگر کسی درخواست داد، چند زمان پیشنهادی می‌فرستی."
  }
];

export function GuidePage() {
  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>راهنمای Useravaa</span>
            <h1>Useravaa چیست؟</h1>
            <p>براساس نقش، حوزه شغلی، شرکت و رده سازمانی جستجو می‌کنی؛ پروفایل تجربه را می‌بینی و اگر مناسب بود، درخواست جلسه مشاوره می‌دهی.</p>
            <div className={styles.heroActions}>
              <V51LinkButton href="/discover" tone="primary">
                کشف تجربه‌ها
              </V51LinkButton>
              <V51LinkButton href="/profile/build" tone="secondary">
                ساخت پروفایل تجربه
              </V51LinkButton>
            </div>
          </div>

          <div className={styles.productCard} aria-label="خلاصه جریان Useravaa">
            {productRows.map((row) => (
              <div className={styles.productRow} key={row.number}>
                <span>{row.number}</span>
                <div>
                  <b>{row.title}</b>
                  <small>{row.body}</small>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span>برای چه کسانی؟</span>
            <h2>وقتی تجربه واقعی از توضیح شغل مهم‌تر است.</h2>
          </div>
          <div className={styles.audienceGrid}>
            {audienceRows.map((row) => (
              <article key={row.title}>
                <b>{row.title}</b>
                <p>{row.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span>دو استفاده اصلی</span>
            <h2>هم می‌توانی تجربه دیگران را ببینی، هم تجربه خودت را ارائه کنی.</h2>
          </div>

          <div className={styles.twoFlows}>
            <article className={styles.flowCard}>
              <div className={styles.flowTop}>
                <span>کشف تجربه</span>
                <h3>وقتی می‌خواهی از تجربه دیگران استفاده کنی</h3>
              </div>
              <div className={styles.flowList}>
                {discoverFlow.map((row) => (
                  <div key={row.number}>
                    <i>{row.number}</i>
                    <b>{row.title}</b>
                    <small>{row.body}</small>
                  </div>
                ))}
              </div>
              <V51LinkButton href="/discover" tone="primary" full>
                رفتن به کشف تجربه‌ها
              </V51LinkButton>
            </article>

            <article className={styles.flowCard}>
              <div className={styles.flowTop}>
                <span>ارائه تجربه</span>
                <h3>وقتی می‌خواهی تجربه خودت را ارائه کنی</h3>
              </div>
              <div className={styles.flowList}>
                {offerFlow.map((row) => (
                  <div key={row.number}>
                    <i>{row.number}</i>
                    <b>{row.title}</b>
                    <small>{row.body}</small>
                  </div>
                ))}
              </div>
              <V51LinkButton href="/profile/build" tone="secondary" full>
                ساخت پروفایل تجربه
              </V51LinkButton>
            </article>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div>
            <h2>از کشف تجربه‌ها شروع کن.</h2>
            <p>آدم‌هایی را پیدا کن که تجربه‌شان به تصمیم شغلی تو نزدیک است.</p>
          </div>
          <div>
            <V51LinkButton href="/discover" tone="primary">
              کشف تجربه‌ها
            </V51LinkButton>
            <V51LinkButton href="/profile/build" tone="secondary">
              ساخت پروفایل تجربه
            </V51LinkButton>
          </div>
        </section>
      </div>
    </section>
  );
}
