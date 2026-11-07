import { adminRequest } from "../../lib/admin-http.ts";
import {
  CONTENT_SECTION_KEYS,
  type ContentSectionKey,
  type ContentSectionSummary,
} from "./content-contract.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSectionKey(value: unknown): value is ContentSectionKey {
  return CONTENT_SECTION_KEYS.includes(value as ContentSectionKey);
}

export function parseContentSummaries(
  value: unknown,
): readonly ContentSectionSummary[] {
  if (
    !isRecord(value) ||
    Object.keys(value).some((key) => key !== "sections")
  ) {
    throw new Error("Invalid content summary response");
  }
  if (!Array.isArray(value.sections)) {
    throw new Error("Invalid content summary response");
  }
  return value.sections.map((section) => {
    if (
      !isRecord(section) ||
      Object.keys(section).some(
        (key) =>
          !["sectionKey", "revision", "isPublished", "document"].includes(key),
      ) ||
      !isSectionKey(section.sectionKey) ||
      typeof section.revision !== "string" ||
      !/^[1-9][0-9]*$/.test(section.revision) ||
      typeof section.isPublished !== "boolean" ||
      !isRecord(section.document)
    ) {
      throw new Error("Invalid content summary response");
    }
    return {
      sectionKey: section.sectionKey,
      revision: section.revision,
      isPublished: section.isPublished,
    };
  });
}

export function createContentClient(apiOrigin: string) {
  return {
    list: async (signal?: AbortSignal) =>
      parseContentSummaries(
        await adminRequest(apiOrigin, "/api/admin/content", { signal }),
      ),
  };
}

export type ContentClient = ReturnType<typeof createContentClient>;
