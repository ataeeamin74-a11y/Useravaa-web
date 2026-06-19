import type { Viewer } from "@/lib/auth/types";
import {
  canRequesterCancelRequest as canRequesterCancelRequestForFixture,
  canRequesterRequestNewTimes as canRequesterRequestNewTimesForFixture,
  conversations,
  getAttendanceVerificationStatus,
  getConversationById,
  getConversationRouteAccess,
  getPaymentStatus,
  hasConversationStarted,
  shouldShowAttendanceVerificationFlow,
  type ConversationFixture
} from "./data/conversations";

export const V51_PROFILE_FIXTURE_OWNER_ID = "user-requester";

export type ProtectedRoutePolicy = {
  pathPattern: string;
  area: "user" | "admin" | "resource";
  allowedRoles: readonly Viewer["role"][];
  relationship: "authenticated_user" | "conversation_participant" | "requester_owner" | "provider_owner" | "wallet_owner" | "profile_owner" | "admin_or_support_role";
  unauthenticated: "redirect:/login";
  unauthorized: "not_found" | "generic_unauthorized";
  enforcement: "server_route";
};

export const protectedRoutePermissionMatrix = [
  {
    pathPattern: "/profile",
    area: "resource",
    allowedRoles: ["USER", "ADMIN", "SUPPORT"],
    relationship: "profile_owner",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  },
  {
    pathPattern: "/profile/build",
    area: "resource",
    allowedRoles: ["USER", "ADMIN", "SUPPORT"],
    relationship: "profile_owner",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  },
  {
    pathPattern: "/profile/network",
    area: "resource",
    allowedRoles: ["USER", "ADMIN", "SUPPORT"],
    relationship: "profile_owner",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  },
  {
    pathPattern: "/profile/feedback",
    area: "resource",
    allowedRoles: ["USER", "ADMIN", "SUPPORT"],
    relationship: "profile_owner",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  },
  {
    pathPattern: "/profile/settings",
    area: "resource",
    allowedRoles: ["USER", "ADMIN", "SUPPORT"],
    relationship: "profile_owner",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  },
  {
    pathPattern: "/profile/insights",
    area: "resource",
    allowedRoles: ["USER", "ADMIN", "SUPPORT"],
    relationship: "profile_owner",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  },
  {
    pathPattern: "/settings",
    area: "resource",
    allowedRoles: ["USER", "ADMIN", "SUPPORT"],
    relationship: "profile_owner",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  },
  {
    pathPattern: "/wallet",
    area: "resource",
    allowedRoles: ["USER", "ADMIN", "SUPPORT"],
    relationship: "wallet_owner",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  },
  {
    pathPattern: "/notifications",
    area: "user",
    allowedRoles: ["USER", "ADMIN", "SUPPORT"],
    relationship: "authenticated_user",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  },
  {
    pathPattern: "/actions",
    area: "user",
    allowedRoles: ["USER", "ADMIN", "SUPPORT"],
    relationship: "authenticated_user",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  },
  {
    pathPattern: "/conversations",
    area: "user",
    allowedRoles: ["USER", "ADMIN", "SUPPORT"],
    relationship: "authenticated_user",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  },
  {
    pathPattern: "/requests",
    area: "user",
    allowedRoles: ["USER", "ADMIN", "SUPPORT"],
    relationship: "authenticated_user",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  },
  {
    pathPattern: "/sessions",
    area: "user",
    allowedRoles: ["USER", "ADMIN", "SUPPORT"],
    relationship: "authenticated_user",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  },
  {
    pathPattern: "/conversations/[conversationId]",
    area: "resource",
    allowedRoles: ["USER", "ADMIN", "SUPPORT"],
    relationship: "conversation_participant",
    unauthenticated: "redirect:/login",
    unauthorized: "not_found",
    enforcement: "server_route"
  },
  {
    pathPattern: "/conversations/[conversationId]/propose-times",
    area: "resource",
    allowedRoles: ["USER"],
    relationship: "provider_owner",
    unauthenticated: "redirect:/login",
    unauthorized: "not_found",
    enforcement: "server_route"
  },
  {
    pathPattern: "/conversations/[conversationId]/select-time",
    area: "resource",
    allowedRoles: ["USER"],
    relationship: "requester_owner",
    unauthenticated: "redirect:/login",
    unauthorized: "not_found",
    enforcement: "server_route"
  },
  {
    pathPattern: "/checkout",
    area: "resource",
    allowedRoles: ["USER"],
    relationship: "requester_owner",
    unauthenticated: "redirect:/login",
    unauthorized: "not_found",
    enforcement: "server_route"
  },
  {
    pathPattern: "/checkout/[conversationId]",
    area: "resource",
    allowedRoles: ["USER"],
    relationship: "requester_owner",
    unauthenticated: "redirect:/login",
    unauthorized: "not_found",
    enforcement: "server_route"
  },
  {
    pathPattern: "/requests/new",
    area: "user",
    allowedRoles: ["USER", "ADMIN", "SUPPORT"],
    relationship: "authenticated_user",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  },
  {
    pathPattern: "/saved",
    area: "user",
    allowedRoles: ["USER", "ADMIN", "SUPPORT"],
    relationship: "authenticated_user",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  },
  {
    pathPattern: "/insights/respond/*",
    area: "user",
    allowedRoles: ["USER", "ADMIN", "SUPPORT"],
    relationship: "authenticated_user",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  },
  {
    pathPattern: "/insights/new",
    area: "admin",
    allowedRoles: ["ADMIN", "SUPPORT"],
    relationship: "admin_or_support_role",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  },
  {
    pathPattern: "/insights/create",
    area: "admin",
    allowedRoles: ["ADMIN", "SUPPORT"],
    relationship: "admin_or_support_role",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  },
  {
    pathPattern: "/insights/edit/*",
    area: "admin",
    allowedRoles: ["ADMIN", "SUPPORT"],
    relationship: "admin_or_support_role",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  },
  {
    pathPattern: "/admin",
    area: "admin",
    allowedRoles: ["ADMIN", "SUPPORT"],
    relationship: "admin_or_support_role",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  },
  {
    pathPattern: "/admin/*",
    area: "admin",
    allowedRoles: ["ADMIN", "SUPPORT"],
    relationship: "admin_or_support_role",
    unauthenticated: "redirect:/login",
    unauthorized: "generic_unauthorized",
    enforcement: "server_route"
  }
] as const satisfies readonly ProtectedRoutePolicy[];

type RouteAccessDecision =
  | {
      status: "allowed";
      policy: ProtectedRoutePolicy | null;
    }
  | {
      status: "redirect_login" | "unauthorized";
      policy: ProtectedRoutePolicy;
      behavior: ProtectedRoutePolicy["unauthorized"] | ProtectedRoutePolicy["unauthenticated"];
    };

function routePatternMatches(pathname: string, pattern: string) {
  if (pattern.endsWith("/*")) {
    return pathname.startsWith(pattern.slice(0, -1));
  }

  if (pattern.includes("[conversationId]")) {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("\\[conversationId\\]", "[^/]+");
    return new RegExp(`^${escaped}$`).test(pathname);
  }

  return pathname === pattern;
}

export function getProtectedRoutePolicy(pathname: string): ProtectedRoutePolicy | null {
  return protectedRoutePermissionMatrix.find((policy) => routePatternMatches(pathname, policy.pathPattern)) ?? null;
}

export function getProtectedRouteAccess(pathname: string, viewer: Viewer | null): RouteAccessDecision {
  const policy = getProtectedRoutePolicy(pathname);

  if (!policy) {
    return {
      status: "allowed",
      policy: null
    };
  }

  if (!viewer) {
    return {
      status: "redirect_login",
      policy,
      behavior: policy.unauthenticated
    };
  }

  if (!policy.allowedRoles.includes(viewer.role)) {
    return {
      status: "unauthorized",
      policy,
      behavior: policy.unauthorized
    };
  }

  if (policy.area === "admin" && !canAccessAdmin(viewer)) {
    return {
      status: "unauthorized",
      policy,
      behavior: policy.unauthorized
    };
  }

  return {
    status: "allowed",
    policy
  };
}

export function canAccessAdmin(viewer: Viewer | null | undefined) {
  return viewer?.role === "ADMIN" || viewer?.role === "SUPPORT";
}

export function canViewWallet(viewer: Viewer | null | undefined, walletOwnerId: string | null | undefined) {
  return Boolean(viewer?.id && walletOwnerId && viewer.id === walletOwnerId);
}

export function canEditProfile(viewer: Viewer | null | undefined, profileUserId: string | null | undefined) {
  return Boolean(viewer?.id && profileUserId && viewer.id === profileUserId);
}

function requesterMatches(viewer: Viewer | null | undefined, conversation: ConversationFixture | null | undefined) {
  return Boolean(viewer?.id && conversation?.requesterId && viewer.id === conversation.requesterId);
}

function providerMatches(viewer: Viewer | null | undefined, conversation: ConversationFixture | null | undefined) {
  return Boolean(viewer?.id && conversation?.providerId && viewer.id === conversation.providerId);
}

function providerMaySeeConversation(conversation: ConversationFixture) {
  const paymentStatus = getPaymentStatus(conversation);

  if (paymentStatus === "UNPAID" || paymentStatus === "PENDING_REVIEW" || paymentStatus === "PROCESSING" || paymentStatus === "FAILED") {
    return false;
  }

  return conversation.status !== "pending_payment" && conversation.status !== "payment_processing";
}

export function alignConversationForViewer(viewer: Viewer, conversation: ConversationFixture): ConversationFixture {
  if (requesterMatches(viewer, conversation)) {
    return {
      ...conversation,
      direction: "outgoing"
    };
  }

  if (providerMatches(viewer, conversation)) {
    return {
      ...conversation,
      direction: "incoming"
    };
  }

  return conversation;
}

export function canViewConversation(viewer: Viewer | null | undefined, conversation: ConversationFixture | null | undefined) {
  if (!viewer || !conversation) {
    return false;
  }

  if (requesterMatches(viewer, conversation)) {
    return true;
  }

  if (providerMatches(viewer, conversation)) {
    return providerMaySeeConversation(conversation);
  }

  return false;
}

export function canRequestNewTimes(viewer: Viewer | null | undefined, conversation: ConversationFixture | null | undefined) {
  return Boolean(viewer && conversation && requesterMatches(viewer, conversation) && canRequesterRequestNewTimesForFixture(alignConversationForViewer(viewer, conversation), viewer.id));
}

export function canProposeTimes(viewer: Viewer | null | undefined, conversation: ConversationFixture | null | undefined) {
  return Boolean(viewer && conversation && providerMatches(viewer, conversation) && getConversationRouteAccess(alignConversationForViewer(viewer, conversation), "proposeTimes").allowed);
}

export function canSelectTime(viewer: Viewer | null | undefined, conversation: ConversationFixture | null | undefined) {
  return Boolean(viewer && conversation && requesterMatches(viewer, conversation) && getConversationRouteAccess(alignConversationForViewer(viewer, conversation), "selectTime").allowed);
}

export function canAccessCheckout(viewer: Viewer | null | undefined, conversation: ConversationFixture | null | undefined) {
  return Boolean(viewer && conversation && requesterMatches(viewer, conversation) && getConversationRouteAccess(alignConversationForViewer(viewer, conversation), "checkout").allowed);
}

export function canViewRequesterAttendanceCode(viewer: Viewer | null | undefined, conversation: ConversationFixture | null | undefined) {
  return Boolean(
    viewer &&
      conversation &&
      requesterMatches(viewer, conversation) &&
      getAttendanceVerificationStatus(conversation) === "PENDING" &&
      conversation.attendanceVerificationCode
  );
}

export function canSubmitAttendanceCode(viewer: Viewer | null | undefined, conversation: ConversationFixture | null | undefined) {
  return Boolean(
    viewer &&
      conversation &&
      providerMatches(viewer, conversation) &&
      shouldShowAttendanceVerificationFlow(conversation) &&
      hasConversationStarted(conversation)
  );
}

export function canCancelConversation(viewer: Viewer | null | undefined, conversation: ConversationFixture | null | undefined) {
  return Boolean(viewer && conversation && requesterMatches(viewer, conversation) && canRequesterCancelRequestForFixture(alignConversationForViewer(viewer, conversation), viewer.id));
}

export function getVisibleConversationsForViewer(viewer: Viewer, source: readonly ConversationFixture[] = conversations) {
  return source.filter((conversation) => canViewConversation(viewer, conversation)).map((conversation) => alignConversationForViewer(viewer, conversation));
}

export function getAuthorizedConversationForViewer(viewer: Viewer, conversationId: string) {
  const conversation = getConversationById(conversationId);

  if (!conversation || !canViewConversation(viewer, conversation)) {
    return null;
  }

  return alignConversationForViewer(viewer, conversation);
}

export function getNotificationsForViewer<T extends { receiverId: string }>(viewer: Viewer, notifications: readonly T[]) {
  return notifications.filter((notification) => notification.receiverId === viewer.id);
}
