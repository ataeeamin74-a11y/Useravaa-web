import styles from "./UnauthorizedState.module.css";

export function UnauthorizedState() {
  return (
    <section className={styles.shell} aria-live="polite">
      <h1>به این بخش دسترسی ندارید.</h1>
      <p>این صفحه فقط برای کاربرانی نمایش داده می‌شود که به این درخواست یا حساب دسترسی دارند.</p>
    </section>
  );
}
