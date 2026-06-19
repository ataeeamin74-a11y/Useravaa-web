import { Prisma } from "@prisma/client";
import { getPrismaClient } from "./prisma";

export type UseravaaTransactionClient = Prisma.TransactionClient;

export type UseravaaTransactionOptions = {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
};

export const useravaaTransactionUseCases = [
  "create_request_with_payment_record",
  "approve_payment_and_expose_conversation",
  "approve_or_reject_payment_and_write_audit",
  "approve_or_reject_cancellation_support_credit_and_write_audit",
  "review_experience_profile_and_write_audit",
  "moderate_insight_content_and_write_audit",
  "manage_pricing_rule_and_write_audit",
  "manage_job_category_and_write_audit",
  "propose_times_and_supersede_old_options",
  "select_time_and_confirm_session",
  "cancel_conversation_and_create_wallet_credit",
  "submit_attendance_code_and_update_status",
  "create_withdrawal_request_and_wallet_transaction"
] as const;

export async function withUseravaaTransaction<T>(
  operation: (tx: UseravaaTransactionClient) => Promise<T>,
  options?: UseravaaTransactionOptions
) {
  const prisma = getPrismaClient();
  return prisma.$transaction((tx) => operation(tx), options);
}
