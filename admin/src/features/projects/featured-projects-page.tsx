import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo } from "react";

import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { OperationAlert } from "../shell/operation-alert";
import type { AdminProject, FeaturedDraft } from "./project-contract";
import { FeaturedProjectCombobox } from "./featured-project-combobox";
import {
  isFeaturedEligible,
  moveFeaturedSlot,
  validateFeaturedSlots,
} from "./featured-projects-model";
import type { SaveNotice } from "./use-project-workspace";

type FeaturedProjectsPageProps = {
  readonly dirty: boolean;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly notice: SaveNotice | null;
  readonly onChange: (slots: FeaturedDraft["slots"]) => void;
  readonly onCheckStatus: () => void;
  readonly onSave: () => void;
  readonly pendingOperationId: string | null;
  readonly projects: readonly AdminProject[];
  readonly slots: FeaturedDraft["slots"];
};

export function FeaturedProjectsPage({
  dirty,
  isLoading,
  isSaving,
  notice,
  onChange,
  onCheckStatus,
  onSave,
  pendingOperationId,
  projects,
  slots,
}: FeaturedProjectsPageProps) {
  const validation = useMemo(
    () => validateFeaturedSlots(slots, projects),
    [projects, slots],
  );
  const disabled = isLoading || isSaving || pendingOperationId !== null;
  const eligibleCount = projects.filter(isFeaturedEligible).length;

  function setSlot(index: 0 | 1 | 2, projectId: string | null) {
    const next: [string | null, string | null, string | null] = [...slots];
    next[index] = projectId;
    onChange(next);
  }

  return (
    <section className="featured-workspace" aria-labelledby="featured-title">
      <header className="featured-page-header">
        <div>
          <h1 id="featured-title">Featured Projects</h1>
          <p>
            Choose exactly three eligible Projects and arrange their homepage
            order. Saving does not publish the website.
          </p>
        </div>
        <span className="featured-eligibility-count">
          {eligibleCount} eligible
        </span>
      </header>

      {notice && <OperationAlert kind={notice.kind} message={notice.message} />}
      {pendingOperationId !== null && !isSaving && (
        <Button onClick={onCheckStatus} type="button" variant="outline">
          Check save status
        </Button>
      )}

      <div className="featured-slots" aria-busy={isLoading}>
        {isLoading
          ? Array.from({ length: 3 }, (_, index) => (
              <div className="featured-slot-row" key={index}>
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-9 w-full rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            ))
          : slots.map((projectId, index) => {
              const slotIndex = index as 0 | 1 | 2;
              const error = validation.errors[slotIndex];
              const errorId = error ? `featured-${index}-error` : undefined;
              return (
                <div className="featured-slot-row" key={index}>
                  <div className="featured-slot-label">
                    <strong>Featured {index + 1}</strong>
                    <span>
                      {index === 0 ? "First" : index === 1 ? "Second" : "Third"}{" "}
                      on the homepage
                    </span>
                  </div>
                  <div>
                    <FeaturedProjectCombobox
                      disabled={disabled}
                      errorId={errorId}
                      onChange={(nextProjectId) =>
                        setSlot(slotIndex, nextProjectId)
                      }
                      projects={projects}
                      selectedIds={slots}
                      value={projectId}
                    />
                    {error && (
                      <p className="field-error" id={errorId}>
                        {error}
                      </p>
                    )}
                  </div>
                  <div className="featured-order-actions">
                    <Button
                      aria-label={`Move Featured ${index + 1} up`}
                      disabled={disabled || index === 0}
                      onClick={() =>
                        onChange(moveFeaturedSlot(slots, slotIndex, "up"))
                      }
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <ArrowUp aria-hidden="true" />
                    </Button>
                    <Button
                      aria-label={`Move Featured ${index + 1} down`}
                      disabled={disabled || index === 2}
                      onClick={() =>
                        onChange(moveFeaturedSlot(slots, slotIndex, "down"))
                      }
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <ArrowDown aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              );
            })}
      </div>

      <div className="featured-actions">
        <span className="form-draft-status" role="status">
          {pendingOperationId !== null
            ? "Outcome unknown"
            : isSaving
              ? "Saving…"
              : dirty
                ? validation.valid
                  ? "Unsaved changes"
                  : "Review Featured selections"
                : "Featured selection saved"}
        </span>
        <Button
          disabled={disabled || !dirty || !validation.valid}
          onClick={onSave}
          type="button"
        >
          {isSaving ? "Saving…" : "Save Featured"}
        </Button>
      </div>
    </section>
  );
}
