import type { AdminProject, ProjectDraft } from "./project-contract";

type ConflictPanelProps = {
  readonly attempted: ProjectDraft;
  readonly authoritative: AdminProject;
  readonly onKeepEdits: () => void;
  readonly onUseSaved: () => void;
};

function display(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value === undefined || value === "") return "Not set";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  return "Not set";
}

export function ConflictPanel({
  attempted,
  authoritative,
  onKeepEdits,
  onUseSaved,
}: ConflictPanelProps) {
  const fields = Object.keys(attempted) as (keyof ProjectDraft)[];
  const differences = fields.filter(
    (field) =>
      JSON.stringify(attempted[field]) !==
      JSON.stringify(authoritative.draft[field]),
  );

  return (
    <section className="conflict-panel" aria-labelledby="conflict-title">
      <div>
        <p className="eyebrow">Save blocked</p>
        <h3 id="conflict-title">This draft changed in another session</h3>
        <p>
          Nothing was overwritten. Compare your attempted values with revision{" "}
          {authoritative.revision}, then choose which version to continue
          editing.
        </p>
      </div>
      <div
        className="conflict-table"
        role="table"
        aria-label="Conflicting fields"
      >
        <div className="conflict-row conflict-row--head" role="row">
          <span role="columnheader">Field</span>
          <span role="columnheader">Your edit</span>
          <span role="columnheader">Saved draft</span>
        </div>
        {differences.map((field) => (
          <div className="conflict-row" role="row" key={field}>
            <strong role="cell">{field}</strong>
            <span role="cell">{display(attempted[field])}</span>
            <span role="cell">{display(authoritative.draft[field])}</span>
          </div>
        ))}
      </div>
      <div className="button-row">
        <button
          className="button button--primary"
          onClick={onKeepEdits}
          type="button"
        >
          Keep my edits
        </button>
        <button className="button" onClick={onUseSaved} type="button">
          Use saved draft
        </button>
      </div>
    </section>
  );
}
