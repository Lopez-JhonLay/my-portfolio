import type { ContentSectionSummary } from "../content/content-contract";

export type OverviewReadiness =
  | { readonly status: "loading"; readonly sections: readonly [] }
  | {
      readonly status: "ready";
      readonly sections: readonly ContentSectionSummary[];
    }
  | { readonly status: "error"; readonly sections: readonly [] };

export type OverviewAttention =
  | { readonly kind: "loading"; readonly message: string }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "warning"; readonly message: string }
  | { readonly kind: "success"; readonly message: string };

export function getPublishedSectionCount(readiness: OverviewReadiness): number {
  if (readiness.status !== "ready") return 0;
  return readiness.sections.filter((section) => section.isPublished).length;
}

export function getOverviewAttention(options: {
  readonly hasUnsavedChanges: boolean;
  readonly pendingOperationCount: number;
  readonly readiness: OverviewReadiness;
}): OverviewAttention {
  if (options.readiness.status === "loading") {
    return {
      kind: "loading",
      message: "Checking the saved and published content state…",
    };
  }
  if (options.readiness.status === "error") {
    return {
      kind: "error",
      message:
        "Published content status could not be loaded. Reload this page to try again.",
    };
  }
  if (options.pendingOperationCount > 0) {
    return {
      kind: "warning",
      message:
        options.pendingOperationCount === 1
          ? "One save or publish operation needs its status checked."
          : `${options.pendingOperationCount} save or publish operations need their status checked.`,
    };
  }
  if (options.hasUnsavedChanges) {
    return {
      kind: "warning",
      message: "Projects or Featured Projects contain unsaved changes.",
    };
  }

  const unpublishedCount = options.readiness.sections.filter(
    (section) => !section.isPublished,
  ).length;
  if (unpublishedCount > 0) {
    return {
      kind: "warning",
      message:
        unpublishedCount === 1
          ? "One content section has not been published yet."
          : `${unpublishedCount} content sections have not been published yet.`,
    };
  }
  return {
    kind: "success",
    message: "Everything saved in the CMS is published.",
  };
}
