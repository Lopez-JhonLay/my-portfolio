import { Skeleton } from "../../components/ui/skeleton";
import type { EditableContentSectionKey } from "./content-contract";

type TextContentSectionKey = Exclude<EditableContentSectionKey, "media-resume">;

type SkeletonSection = {
  readonly fields?: number;
  readonly rows?: number;
  readonly title: string;
};

const layouts: Record<TextContentSectionKey, readonly SkeletonSection[]> = {
  hero: [{ title: "Personal information", fields: 5 }],
  about: [
    { title: "Paragraphs", rows: 4 },
    { title: "Facts", rows: 4 },
  ],
  timeline: [{ title: "Timeline entries", rows: 3 }],
  technologies: [{ title: "Technology categories", rows: 5 }],
  contact: [
    { title: "Contact information", fields: 3 },
    { title: "Social links", rows: 3 },
  ],
};

function FieldSkeleton() {
  return (
    <div className="content-field">
      <Skeleton className="h-3 w-24 rounded-full" />
      <Skeleton className="h-9 w-full rounded-full" />
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="content-array-row">
      <div className="content-field">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
      <div className="content-row-actions">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </div>
  );
}

export function ContentEditorSkeleton({
  sectionKey,
}: {
  readonly sectionKey: TextContentSectionKey;
}) {
  return (
    <div aria-busy="true" role="status">
      <span className="sr-only">Loading {sectionKey} draft…</span>
      {layouts[sectionKey].map((section) => (
        <section className="content-form-section" key={section.title}>
          <h2>{section.title}</h2>
          {section.fields ? (
            <div className="content-field-grid">
              {Array.from({ length: section.fields }, (_, index) => (
                <FieldSkeleton key={index} />
              ))}
            </div>
          ) : null}
          {section.rows ? (
            <div className="content-array-list">
              {Array.from({ length: section.rows }, (_, index) => (
                <RowSkeleton key={index} />
              ))}
            </div>
          ) : null}
        </section>
      ))}
      <div className="content-save-bar" aria-hidden="true">
        <Skeleton className="h-4 w-28 rounded-full" />
        <div>
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}
