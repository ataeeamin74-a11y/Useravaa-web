import { getRouteById, type RouteId } from "@/lib/routes";
import styles from "./RoutePlaceholder.module.css";

type RoutePlaceholderProps = Readonly<{
  routeId: RouteId;
}>;

export function RoutePlaceholder({ routeId }: RoutePlaceholderProps) {
  const route = getRouteById(routeId);

  return (
    <section className={styles.page} aria-labelledby={`${route.id}-title`}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>اسکلت تولید</span>
        <h1 id={`${route.id}-title`}>{route.title}</h1>
        <p>{route.summary}</p>
      </div>

      <div className={styles.panel}>
        <div className={styles.row}>
          <span>مسیر</span>
          <b dir="ltr">{route.href}</b>
        </div>
        <div className={styles.row}>
          <span>قرارداد API</span>
          <b dir="ltr">{route.requiredApi}</b>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2>اقدام‌های اصلی</h2>
          <div className={styles.chips}>
            {route.primaryActions.map((action) => (
              <span key={action} dir="ltr">
                {action}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.card}>
          <h2>وضعیت‌ها</h2>
          <div className={styles.chips}>
            {route.states.map((state) => (
              <span key={state} dir="ltr">
                {state}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
