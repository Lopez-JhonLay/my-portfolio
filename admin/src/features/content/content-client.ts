import { adminRequest } from "../../lib/admin-http.ts";
import {
  CONTENT_SECTION_KEYS,
  EDITABLE_CONTENT_SECTION_KEYS,
  type AboutDocument,
  type AdminContentSection,
  type ContactDocument,
  type ContentSaveOperation,
  type ContentSaveResult,
  type EditableContentDocument,
  type EditableContentSectionKey,
  type HeroDocument,
  type ContentSectionKey,
  type ContentSectionSummary,
} from "./content-contract.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSectionKey(value: unknown): value is ContentSectionKey {
  return CONTENT_SECTION_KEYS.includes(value as ContentSectionKey);
}

function isEditableSectionKey(
  value: unknown,
): value is EditableContentSectionKey {
  return EDITABLE_CONTENT_SECTION_KEYS.includes(
    value as EditableContentSectionKey,
  );
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]) {
  return Object.keys(value).every((key) => keys.includes(key));
}

function isText(value: unknown): value is string {
  return typeof value === "string";
}

function isHeroDocument(value: unknown): value is HeroDocument {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "browserTitle",
      "name",
      "brand",
      "role",
      "heroRole",
      "location",
      "navigation",
      "sectionTag",
      "title",
      "description",
      "resumeButtonLabel",
      "scrollCue",
    ])
  )
    return false;
  const textFields = [
    "browserTitle",
    "name",
    "brand",
    "role",
    "heroRole",
    "location",
    "sectionTag",
    "title",
    "description",
    "resumeButtonLabel",
    "scrollCue",
  ];
  return (
    textFields.every((field) => isText(value[field])) &&
    Array.isArray(value.navigation) &&
    value.navigation.length === 6 &&
    value.navigation.every(
      (item) =>
        isRecord(item) &&
        hasOnlyKeys(item, ["label", "href"]) &&
        isText(item.label) &&
        isText(item.href),
    )
  );
}

function isAboutDocument(value: unknown): value is AboutDocument {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, [
      "eyebrow",
      "title",
      "lead",
      "paragraphs",
      "facts",
      "stamp",
      "photoCaptionPrefix",
    ]) &&
    ["eyebrow", "title", "lead", "stamp", "photoCaptionPrefix"].every((field) =>
      isText(value[field]),
    ) &&
    Array.isArray(value.paragraphs) &&
    value.paragraphs.every(isText) &&
    Array.isArray(value.facts) &&
    value.facts.every(
      (fact) =>
        isRecord(fact) &&
        hasOnlyKeys(fact, ["label", "value"]) &&
        isText(fact.label) &&
        isText(fact.value),
    )
  );
}

function isContactDocument(value: unknown): value is ContactDocument {
  const iconKeys = ["facebook", "github", "linkedin", "external"];
  return (
    isRecord(value) &&
    hasOnlyKeys(value, [
      "eyebrow",
      "title",
      "availability",
      "noteTitle",
      "noteBody",
      "email",
      "socialLinks",
      "footerPrimary",
      "footerSecondary",
    ]) &&
    [
      "eyebrow",
      "title",
      "availability",
      "noteTitle",
      "noteBody",
      "email",
      "footerPrimary",
      "footerSecondary",
    ].every((field) => isText(value[field])) &&
    Array.isArray(value.socialLinks) &&
    value.socialLinks.every(
      (link) =>
        isRecord(link) &&
        hasOnlyKeys(link, ["label", "href", "iconKey"]) &&
        isText(link.label) &&
        isText(link.href) &&
        iconKeys.includes(link.iconKey as string),
    )
  );
}

function parseDocument(
  sectionKey: EditableContentSectionKey,
  value: unknown,
): EditableContentDocument {
  if (sectionKey === "hero" && isHeroDocument(value)) return value;
  if (sectionKey === "about" && isAboutDocument(value)) return value;
  if (sectionKey === "contact" && isContactDocument(value)) return value;
  throw new Error("Invalid content document response");
}

export function parseAdminContentSection(value: unknown): AdminContentSection {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "sectionKey",
      "revision",
      "isPublished",
      "document",
    ]) ||
    !isEditableSectionKey(value.sectionKey) ||
    typeof value.revision !== "string" ||
    !/^[1-9][0-9]*$/.test(value.revision) ||
    typeof value.isPublished !== "boolean"
  ) {
    throw new Error("Invalid content section response");
  }
  return {
    sectionKey: value.sectionKey,
    revision: value.revision,
    isPublished: value.isPublished,
    document: parseDocument(value.sectionKey, value.document),
  };
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function parseContentOperation(value: unknown): ContentSaveOperation {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "operationId",
      "kind",
      "sectionKey",
      "status",
      "outcomeCode",
      "resultRevision",
    ]) ||
    !isUuid(value.operationId) ||
    value.kind !== "save_content_draft" ||
    !isEditableSectionKey(value.sectionKey)
  )
    throw new Error("Invalid content operation response");
  if (
    value.status === "pending" &&
    value.outcomeCode === undefined &&
    value.resultRevision === undefined
  ) {
    return {
      operationId: value.operationId,
      kind: value.kind,
      sectionKey: value.sectionKey,
      status: value.status,
    };
  }
  if (
    (value.status === "succeeded" || value.status === "failed") &&
    (value.outcomeCode === "content_draft_saved" ||
      value.outcomeCode === "stale_revision") &&
    typeof value.resultRevision === "string" &&
    /^[1-9][0-9]*$/.test(value.resultRevision)
  ) {
    return value as ContentSaveOperation;
  }
  throw new Error("Invalid content operation response");
}

function parseSaveResult(value: unknown): ContentSaveResult {
  if (isRecord(value) && "document" in value)
    return parseAdminContentSection(value);
  return parseContentOperation(value);
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
    read: async (sectionKey: EditableContentSectionKey, signal?: AbortSignal) =>
      parseAdminContentSection(
        await adminRequest(apiOrigin, `/api/admin/content/${sectionKey}`, {
          signal,
        }),
      ),
    save: async (
      sectionKey: EditableContentSectionKey,
      operationId: string,
      csrfToken: string,
      expectedRevision: string,
      document: EditableContentDocument,
    ) =>
      parseSaveResult(
        await adminRequest(
          apiOrigin,
          `/api/admin/content/${sectionKey}/draft`,
          {
            body: { expectedRevision, document },
            csrfToken,
            method: "PUT",
            operationId,
          },
        ),
      ),
    readOperation: async (operationId: string) =>
      parseContentOperation(
        await adminRequest(
          apiOrigin,
          `/api/admin/content-operations/${operationId}`,
        ),
      ),
  };
}

export type ContentClient = ReturnType<typeof createContentClient>;
