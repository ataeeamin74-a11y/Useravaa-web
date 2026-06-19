import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "unauthenticated"
  | "unauthorized"
  | "validation_error"
  | "not_found"
  | "database_not_configured"
  | "target_not_found"
  | "target_not_available"
  | "conversation_not_found"
  | "payment_not_found"
  | "pricing_rule_not_found"
  | "profile_not_found"
  | "insight_not_found"
  | "insight_answer_not_found"
  | "attendance_not_found"
  | "attendance_already_verified"
  | "attendance_code_invalid"
  | "invalid_state"
  | "cancellation_not_allowed"
  | "time_option_not_found"
  | "time_option_not_active"
  | "not_implemented"
  | "provider_not_configured";

export type ApiErrorBody = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
};

export type ApiSuccessBody<T> = {
  ok: true;
  data: T;
};

export type ApiBody<T> = ApiErrorBody | ApiSuccessBody<T>;

export function apiJson<T>(body: ApiBody<T>, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

export function apiError(code: ApiErrorCode, message: string, status: number, details?: unknown) {
  return apiJson(
    {
      ok: false,
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details })
      }
    },
    { status }
  );
}

export function apiOk<T>(data: T, status = 200) {
  return apiJson(
    {
      ok: true,
      data
    },
    { status }
  );
}
