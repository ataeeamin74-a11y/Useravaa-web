import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UnauthorizedState } from "@/components/auth/UnauthorizedState";
import {
  conversations,
  getConversationById,
  getConversationOrFallback,
  reliabilityMockNow,
  type ConversationFixture
} from "@/features/v51/data/conversations";
import { initialWalletFixture, formatToman } from "@/features/v51/data/wallet";
import {
  canAccessAdmin,
  canCancelConversation,
  canEditProfile,
  canSubmitAttendanceCode,
  canViewConversation,
  canViewRequesterAttendanceCode,
  canViewWallet,
  getAuthorizedConversationForViewer,
  getNotificationsForViewer,
  getProtectedRouteAccess,
  getProtectedRoutePolicy,
  getVisibleConversationsForViewer,
  protectedRoutePermissionMatrix,
  V51_PROFILE_FIXTURE_OWNER_ID
} from "@/features/v51/permissions";
import { conversationNotifications } from "@/features/v51/data/conversations";
import type { Viewer } from "@/lib/auth/types";

const requester: Viewer = {
  id: "user-requester",
  role: "USER",
  displayName: "علی",
  canOfferExperience: true
};

const provider: Viewer = {
  id: "provider-reza",
  role: "USER",
  displayName: "رضا",
  canOfferExperience: true
};

const unrelated: Viewer = {
  id: "user-unrelated",
  role: "USER",
  displayName: "کاربر"
};

const admin: Viewer = {
  id: "admin-support",
  role: "ADMIN",
  displayName: "پشتیبانی"
};

const support: Viewer = {
  id: "support-operator",
  role: "SUPPORT",
  displayName: "پشتیبانی"
};

const requiredProtectedRoutes = [
  "/profile",
  "/profile/build",
  "/profile/network",
  "/profile/feedback",
  "/profile/settings",
  "/settings",
  "/wallet",
  "/notifications",
  "/actions",
  "/conversations",
  "/requests",
  "/sessions",
  "/conversations/conv-scheduled",
  "/conversations/conv-provider-request/propose-times",
  "/conversations/conv-time-options/select-time",
  "/checkout/conv-awaiting-payment",
  "/requests/new",
  "/saved",
  "/admin/payments"
] as const;

function fixture(id: string) {
  const conversation = getConversationById(id);

  expect(conversation).toBeDefined();

  return conversation!;
}

function projectFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function started(conversation: ConversationFixture): ConversationFixture {
  return {
    ...conversation,
    selectedTime: conversation.selectedTime
      ? {
          ...conversation.selectedTime,
          startAt: new Date(new Date(reliabilityMockNow).getTime() - 10 * 60 * 1000).toISOString()
        }
      : conversation.selectedTime
  };
}

describe("Checkpoint 1 auth and route permission foundation", () => {
  it("lists every protected route in the central permission matrix", () => {
    const patterns = protectedRoutePermissionMatrix.map((policy) => policy.pathPattern);

    [
      "/profile",
      "/profile/build",
      "/profile/network",
      "/profile/feedback",
      "/profile/settings",
      "/settings",
      "/wallet",
      "/notifications",
      "/actions",
      "/conversations",
      "/requests",
      "/sessions",
      "/conversations/[conversationId]",
      "/conversations/[conversationId]/propose-times",
      "/conversations/[conversationId]/select-time",
      "/checkout/[conversationId]",
      "/requests/new",
      "/saved",
      "/admin/*"
    ].forEach((pattern) => {
      expect(patterns).toContain(pattern);
    });
  });

  it("redirects unauthenticated viewers away from private routes", () => {
    requiredProtectedRoutes.forEach((route) => {
      expect(getProtectedRouteAccess(route, null)).toMatchObject({
        status: "redirect_login",
        behavior: "redirect:/login"
      });
    });
  });

  it("denies normal users from admin payments while allowing admin and support", () => {
    expect(getProtectedRouteAccess("/admin/payments", requester)).toMatchObject({
      status: "unauthorized",
      behavior: "generic_unauthorized"
    });
    expect(canAccessAdmin(requester)).toBe(false);
    expect(getProtectedRouteAccess("/admin/payments", admin).status).toBe("allowed");
    expect(getProtectedRouteAccess("/admin/payments", support).status).toBe("allowed");
    expect(canAccessAdmin(admin)).toBe(true);
    expect(canAccessAdmin(support)).toBe(true);
  });

  it("keeps route wrappers server-guarded before private props are built", () => {
    const guardedRouteFiles = [
      "src/app/profile/page.tsx",
      "src/app/profile/build/page.tsx",
      "src/app/profile/network/page.tsx",
      "src/app/profile/feedback/page.tsx",
      "src/app/profile/settings/page.tsx",
      "src/app/settings/page.tsx",
      "src/app/wallet/page.tsx",
      "src/app/notifications/page.tsx",
      "src/app/actions/page.tsx",
      "src/app/conversations/page.tsx",
      "src/app/requests/page.tsx",
      "src/app/sessions/page.tsx",
      "src/app/conversations/[conversationId]/page.tsx",
      "src/app/conversations/[conversationId]/propose-times/page.tsx",
      "src/app/conversations/[conversationId]/select-time/page.tsx",
      "src/app/checkout/[conversationId]/page.tsx",
      "src/app/requests/new/page.tsx",
      "src/app/saved/page.tsx"
    ];

    guardedRouteFiles.forEach((relativePath) => {
      expect(projectFile(relativePath), relativePath).toContain("requireCurrentViewer");
    });

    expect(projectFile("src/app/admin/payments/page.tsx")).toContain("requireAdminPageAccess");
    expect(projectFile("src/features/v51/admin/access.ts")).toContain("requireCurrentViewer");
    expect(projectFile("src/features/v51/admin/access.ts")).toContain("canAccessAdmin");
    expect(projectFile("src/app/wallet/page.tsx")).toContain("canViewWallet");
  });

  it("does not use fallback private conversations in protected app routes", () => {
    const protectedConversationRouteFiles = [
      "src/app/conversations/[conversationId]/page.tsx",
      "src/app/conversations/[conversationId]/propose-times/page.tsx",
      "src/app/conversations/[conversationId]/select-time/page.tsx",
      "src/app/checkout/[conversationId]/page.tsx"
    ];

    protectedConversationRouteFiles.forEach((relativePath) => {
      const source = projectFile(relativePath);

      expect(source.includes("getConversationById") || source.includes("getAuthorizedConversationForViewer"), relativePath).toBe(true);
      expect(source, relativePath).not.toContain("getConversationOrFallback");
      expect(source, relativePath).toContain("notFound()");
    });

    expect(getConversationOrFallback("unknown-private-id").id).not.toBe("unknown-private-id");
    expect(getAuthorizedConversationForViewer(requester, "unknown-private-id")).toBeNull();
  });

  it("allows requester and provider participants while denying unrelated conversation access", () => {
    const sentConversation = fixture("conv-scheduled");
    const receivedConversation = fixture("conv-provider-request");

    expect(canViewConversation(requester, sentConversation)).toBe(true);
    expect(getAuthorizedConversationForViewer(requester, sentConversation.id)?.direction).toBe("outgoing");
    expect(canViewConversation(provider, receivedConversation)).toBe(true);
    expect(getAuthorizedConversationForViewer(provider, receivedConversation.id)?.direction).toBe("incoming");
    expect(canViewConversation(unrelated, sentConversation)).toBe(false);
    expect(getAuthorizedConversationForViewer(unrelated, sentConversation.id)).toBeNull();
  });

  it("derives visible conversation direction from authenticated viewer relationship", () => {
    const providerConversation = fixture("conv-provider-confirmed");
    const requesterVisible = getVisibleConversationsForViewer({ ...provider, id: providerConversation.requesterId }, [providerConversation]);
    const providerVisible = getVisibleConversationsForViewer(provider, [providerConversation]);

    expect(requesterVisible[0].direction).toBe("outgoing");
    expect(providerVisible[0].direction).toBe("incoming");
  });

  it("locks attendance code visibility to the owning requester and eligible provider action state", () => {
    const requesterConversation = fixture("conv-scheduled");
    const providerConversation = fixture("conv-provider-confirmed");

    expect(canViewRequesterAttendanceCode(requester, requesterConversation)).toBe(true);
    expect(canViewRequesterAttendanceCode(provider, requesterConversation)).toBe(false);
    expect(canViewRequesterAttendanceCode(unrelated, requesterConversation)).toBe(false);
    expect(canViewRequesterAttendanceCode(provider, providerConversation)).toBe(false);
    expect(canSubmitAttendanceCode(provider, started(providerConversation))).toBe(true);
    expect(canSubmitAttendanceCode(requester, started(providerConversation))).toBe(false);
    expect(canSubmitAttendanceCode(unrelated, started(providerConversation))).toBe(false);
  });

  it("allows only requesters to cancel their own conversations", () => {
    const conversation = fixture("conv-time-options");

    expect(canCancelConversation(requester, conversation)).toBe(true);
    expect(canCancelConversation(provider, conversation)).toBe(false);
    expect(canCancelConversation(unrelated, conversation)).toBe(false);
  });

  it("keeps wallet and profile owner checks deny-by-default", () => {
    expect(canViewWallet(requester, initialWalletFixture.ownerUserId)).toBe(true);
    expect(canViewWallet(unrelated, initialWalletFixture.ownerUserId)).toBe(false);
    expect(canViewWallet(null, initialWalletFixture.ownerUserId)).toBe(false);
    expect(canEditProfile(requester, V51_PROFILE_FIXTURE_OWNER_ID)).toBe(true);
    expect(canEditProfile(unrelated, V51_PROFILE_FIXTURE_OWNER_ID)).toBe(false);
  });

  it("does not render wallet amounts or private data in unauthorized states", () => {
    const html = renderToStaticMarkup(<UnauthorizedState />);
    const privateConversation = fixture("conv-manual-payment-review");
    const privateCopies = [
      privateConversation.requesterName,
      privateConversation.profile.name,
      privateConversation.note,
      privateConversation.manualPaymentReferenceNumber ?? "",
      privateConversation.manualPaymentReceiptFileName ?? "",
      fixture("conv-scheduled").attendanceVerificationCode ?? "",
      formatToman(initialWalletFixture.balance)
    ].filter(Boolean);

    privateCopies.forEach((copy) => {
      expect(html).not.toContain(copy);
    });
  });

  it("filters notifications before viewer-facing notification and header surfaces receive them", () => {
    const requesterNotifications = getNotificationsForViewer(requester, conversationNotifications);
    const providerNotifications = getNotificationsForViewer(provider, conversationNotifications);
    const appShellSource = projectFile("src/components/app-shell/AppShell.tsx");
    const headerSource = projectFile("src/components/header/Header.tsx");

    expect(requesterNotifications.every((notification) => notification.receiverId === requester.id)).toBe(true);
    expect(providerNotifications.every((notification) => notification.receiverId === provider.id)).toBe(true);
    expect(appShellSource).toContain("getNotificationsForViewer");
    expect(appShellSource).toContain("notifications={viewer ? buildHeaderNotifications(viewer.id) : []}");
    expect(headerSource).not.toContain("conversationNotifications");
    expect(headerSource).not.toContain("weeklyQuestionNotification");
    expect(headerSource).toContain("notifications = []");
  });

  it("marks protected route policies as server-route enforced and non-leaking for resource routes", () => {
    requiredProtectedRoutes.forEach((route) => {
      expect(getProtectedRoutePolicy(route)?.enforcement).toBe("server_route");
    });

    expect(getProtectedRoutePolicy("/conversations/conv-scheduled")?.unauthorized).toBe("not_found");
    expect(getProtectedRoutePolicy("/checkout/conv-awaiting-payment")?.unauthorized).toBe("not_found");
    expect(conversations.some((conversation) => conversation.id === "unknown-private-id")).toBe(false);
  });
});
