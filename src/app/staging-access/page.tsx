import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import {
  shouldUseSecureStagingOperatorCookie,
  STAGING_OPERATOR_COOKIE_MAX_AGE_SECONDS,
  STAGING_OPERATOR_COOKIE_NAME,
  validateStagingOperatorLogin
} from "@/lib/auth/staging-access";
import { getCurrentSession } from "@/lib/auth/session";
import styles from "@/features/v51/auth/AuthPage.module.css";

export const dynamic = "force-dynamic";

type StagingAccessPageProps = Readonly<{
  searchParams?: Promise<{
    status?: string | string[];
  }>;
}>;

function getFormString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

async function signInStagingOperator(formData: FormData) {
  "use server";

  const result = validateStagingOperatorLogin({
    operatorEmail: getFormString(formData.get("operatorEmail")),
    accessSecret: getFormString(formData.get("stagingAccessSecret"))
  });

  if (!result.ok) {
    redirect("/staging-access?status=failed");
  }

  const cookieStore = await cookies();

  cookieStore.set({
    name: STAGING_OPERATOR_COOKIE_NAME,
    value: result.cookieValue,
    httpOnly: true,
    secure: shouldUseSecureStagingOperatorCookie(),
    sameSite: "lax",
    maxAge: STAGING_OPERATOR_COOKIE_MAX_AGE_SECONDS,
    path: "/"
  });

  redirect("/admin");
}

async function signOutStagingOperator() {
  "use server";

  const cookieStore = await cookies();

  cookieStore.set({
    name: STAGING_OPERATOR_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: shouldUseSecureStagingOperatorCookie(),
    sameSite: "lax",
    maxAge: 0,
    path: "/"
  });

  redirect("/staging-access?status=logged-out");
}

function statusMessage(status: string | string[] | undefined) {
  const value = Array.isArray(status) ? status[0] : status;

  if (value === "failed") {
    return "Staging access failed. Check the operator email, staging secret, and staging-only env flags.";
  }

  if (value === "logged-out") {
    return "Staging operator session cleared.";
  }

  return null;
}

export default async function StagingAccessPage({ searchParams }: StagingAccessPageProps) {
  const params = await searchParams;
  const session = await getCurrentSession();
  const message = statusMessage(params?.status);

  return (
    <PageContainer as="main" variant="empty" className={styles.authShell}>
      <section className={styles.authPage}>
        <h1>Staging operator access</h1>
        <p>This internal staging path creates a short-lived signed cookie for approved operators only. It does not create public accounts.</p>
        {message ? (
          <div className={styles.authNotice} role="status">
            <strong>{message}</strong>
          </div>
        ) : null}
        {session.source === "staging_access" && session.viewer ? (
          <div className={styles.authNotice} role="status">
            <strong>Signed in as {session.viewer.role}</strong>
            <span>{session.viewer.displayName ?? session.viewer.id}</span>
          </div>
        ) : null}
        <form action={signInStagingOperator} className={styles.authForm}>
          <label>
            Operator email
            <input name="operatorEmail" type="email" autoComplete="username" required />
          </label>
          <label>
            Staging access secret
            <input name="stagingAccessSecret" type="password" autoComplete="current-password" required />
          </label>
          <button className={styles.primaryButton} type="submit">
            <span className="button-label">Enter staging</span>
          </button>
        </form>
        <form action={signOutStagingOperator} className={styles.authForm}>
          <button className={styles.secondaryLink} type="submit">
            <span className="button-label">Clear staging session</span>
          </button>
        </form>
        <p className={styles.authNote}>This path works only when staging access is explicitly enabled in a staging environment.</p>
      </section>
    </PageContainer>
  );
}
