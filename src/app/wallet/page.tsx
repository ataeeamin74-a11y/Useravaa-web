import { UnauthorizedState } from "@/components/auth/UnauthorizedState";
import { PageContainer } from "@/components/layout/PageContainer";
import { initialWalletFixture } from "@/features/v51/data/wallet";
import { canViewWallet } from "@/features/v51/permissions";
import { WalletPage as V51WalletPage } from "@/features/v51/wallet/WalletPage";
import { requireCurrentViewer } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const viewer = await requireCurrentViewer();

  if (!canViewWallet(viewer, initialWalletFixture.ownerUserId)) {
    return (
      <PageContainer variant="empty">
        <UnauthorizedState />
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="dashboard">
      <V51WalletPage currentUserId={viewer.id} />
    </PageContainer>
  );
}
