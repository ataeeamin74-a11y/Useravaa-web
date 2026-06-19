import { NextResponse } from "next/server";
import { z } from "zod";
import { canAccessAdmin } from "@/features/v51/permissions";
import { getCurrentSession } from "@/lib/auth/session";
import type { AuthSession, Viewer } from "@/lib/auth/types";
import { apiError } from "./api-response";

export type ApiViewer = {
  viewer: Viewer;
  sessionSource: AuthSession["source"];
};

export function isApiResponse(value: unknown): value is NextResponse {
  return value instanceof Response;
}

export async function requireApiViewer(): Promise<ApiViewer | NextResponse> {
  const session = await getCurrentSession();

  if (!session.viewer) {
    return apiError("unauthenticated", "Authentication is required for this API route.", 401);
  }

  return {
    viewer: session.viewer,
    sessionSource: session.source
  };
}

export async function requireAdminViewer(): Promise<ApiViewer | NextResponse> {
  const auth = await requireApiViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  if (!canAccessAdmin(auth.viewer)) {
    return apiError("unauthorized", "This API route is restricted to admin or support operators.", 403);
  }

  return auth;
}

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema
): Promise<z.infer<TSchema> | NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("validation_error", "Request body must be valid JSON.", 400);
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    return apiError("validation_error", "Request validation failed.", 422, result.error.flatten());
  }

  return result.data;
}

export async function parseOptionalJsonBody<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema
): Promise<z.infer<TSchema> | NextResponse> {
  let body: unknown = {};

  try {
    const text = await request.text();
    body = text.trim() ? JSON.parse(text) : {};
  } catch {
    return apiError("validation_error", "Request body must be valid JSON.", 400);
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    return apiError("validation_error", "Request validation failed.", 422, result.error.flatten());
  }

  return result.data;
}
