import { useravaaRepository } from "@/lib/backend/repository";
import type { AdminCategoryUseCase } from "@/lib/backend/repositories/admin-category";
import { isValidJobField, type JobField } from "./job-fields";

export type PublicCategoryOptionSource = "database" | "unavailable";

export type PublicJobFieldOptionsResult = {
  options: JobField[];
  source: PublicCategoryOptionSource;
};

export type PublicCategoryUseCase = "discovery" | "profile" | "insights";

type PublicCategoryReader = {
  listActiveCategoriesForUseCase: (
    useCase: AdminCategoryUseCase,
  ) => Promise<{
    ok: boolean;
    data?: readonly { labelFa: string }[];
  }>;
};

const useCaseMap: Record<PublicCategoryUseCase, AdminCategoryUseCase> = {
  discovery: "discovery",
  profile: "discovery",
  insights: "insights",
};

export async function getPublicJobFieldOptionsForUseCase(
  useCase: PublicCategoryUseCase,
  reader: PublicCategoryReader = useravaaRepository.adminCategories,
): Promise<PublicJobFieldOptionsResult> {
  try {
    const result = await reader.listActiveCategoriesForUseCase(useCaseMap[useCase]);

    if (!result.ok) {
      return {
        options: [],
        source: "unavailable",
      };
    }

    const categories = result.data ?? [];
    const options = categories
      .map((category) => category.labelFa)
      .filter((label): label is JobField => isValidJobField(label));

    return {
      options: Array.from(new Set(options)),
      source: "database",
    };
  } catch {
    return {
      options: [],
      source: "unavailable",
    };
  }
}
