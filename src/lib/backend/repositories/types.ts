import type { PrismaClient } from "@prisma/client";
import type { BackendArea } from "../domain";
import { getPrismaClient, isPrismaClientConfigurationError } from "../db/prisma";

export type RepositoryMethodClassification =
  | "database_persistent"
  | "read_only_persistent"
  | "write_persistent"
  | "contract_only"
  | "not_implemented";

export type RepositoryFailureReason = "database_not_configured" | "database_unavailable" | "not_implemented";

export type RepositoryOk<T> = {
  ok: true;
  area: BackendArea;
  method: string;
  classification: Extract<RepositoryMethodClassification, "database_persistent" | "read_only_persistent" | "write_persistent">;
  data: T;
};

export type RepositoryBlocked = {
  ok: false;
  area: BackendArea;
  method: string;
  classification: Extract<RepositoryMethodClassification, "contract_only" | "not_implemented">;
  reason: RepositoryFailureReason;
  message: string;
  details?: unknown;
};

export type RepositoryResult<T> = RepositoryOk<T> | RepositoryBlocked;

export type PrismaReader = PrismaClient;

export function repositoryNotImplemented(area: BackendArea, method: string): RepositoryResult<never> {
  return {
    ok: false,
    area,
    method,
    classification: "not_implemented",
    reason: "not_implemented",
    message: "This repository method is intentionally contract-only until the relevant lifecycle checkpoint."
  };
}

export async function readOnlyRepositoryOperation<T>(
  area: BackendArea,
  method: string,
  operation: (db: PrismaReader) => Promise<T>
): Promise<RepositoryResult<T>> {
  try {
    const db = getPrismaClient();
    const data = await operation(db);

    return {
      ok: true,
      area,
      method,
      classification: "read_only_persistent",
      data
    };
  } catch (error) {
    if (isPrismaClientConfigurationError(error)) {
      return {
        ok: false,
        area,
        method,
        classification: "contract_only",
        reason: "database_not_configured",
        message: error.message,
        details: error.details
      };
    }

    if (error instanceof Error && error.name === "PrismaClientInitializationError") {
      return {
        ok: false,
        area,
        method,
        classification: "contract_only",
        reason: "database_unavailable",
        message: error.message
      };
    }

    throw error;
  }
}

