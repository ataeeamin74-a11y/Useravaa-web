import type { ReactNode } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { UnauthorizedState } from "@/components/auth/UnauthorizedState";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminShell } from "@/features/v51/admin/AdminShell";

export const dynamic = "force-dynamic";

type AdminLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return (
      <PageContainer as="section" variant="empty">
        <UnauthorizedState />
      </PageContainer>
    );
  }

  return <AdminShell viewer={viewer}>{children}</AdminShell>;
}
