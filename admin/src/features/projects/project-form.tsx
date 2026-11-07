import { useEffect, useRef, type FormEvent, type ReactNode } from "react";

import {
  PROJECT_CATEGORIES,
  type ProjectFormErrors,
  type ProjectFormValue,
} from "./project-contract";

type ProjectFormProps = {
  readonly disabled: boolean;
  readonly errors: ProjectFormErrors;
  readonly isSaving: boolean;
  readonly onChange: (value: ProjectFormValue) => void;
  readonly onSubmit: () => void;
  readonly statusLabel: string;
  readonly submitDisabled: boolean;
  readonly value: ProjectFormValue;
};

type TextFieldProps = {
  readonly error?: string;
  readonly id: keyof ProjectFormValue;
  readonly label: string;
  readonly onChange: (value: string) => void;
  readonly required?: boolean;
  readonly type?: "number" | "text" | "url";
  readonly value: string;
};

function TextField({
  error,
  id,
  label,
  onChange,
  required = false,
  type = "text",
  value,
}: TextFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? "true" : undefined}
        id={id}
        min={type === "number" ? 1 : undefined}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value}
      />
      {error && (
        <span className="field-error" id={errorId}>
          {error}
        </span>
      )}
    </div>
  );
}

function FormSection({
  children,
  description,
  id,
  title,
}: {
  readonly children: ReactNode;
  readonly description: string;
  readonly id: string;
  readonly title: string;
}) {
  return (
    <section className="form-section" aria-labelledby={id}>
      <header>
        <h3 id={id}>{title}</h3>
        <p>{description}</p>
      </header>
      <div className="form-section-fields">{children}</div>
    </section>
  );
}

export function ProjectForm({
  disabled,
  errors,
  isSaving,
  onChange,
  onSubmit,
  statusLabel,
  submitDisabled,
  value,
}: ProjectFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const errorCount = Object.keys(errors).length;

  useEffect(() => {
    if (errorCount === 0) return;
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [errorCount, errors]);

  function update<Key extends keyof ProjectFormValue>(
    field: Key,
    nextValue: ProjectFormValue[Key],
  ) {
    onChange({ ...value, [field]: nextValue });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="project-form" onSubmit={submit} noValidate ref={formRef}>
      <fieldset disabled={disabled}>
        <legend className="sr-only">Project draft fields</legend>
        {errorCount > 0 && (
          <p className="form-error-summary" role="alert">
            Review {errorCount} highlighted{" "}
            {errorCount === 1 ? "field" : "fields"} before saving.
          </p>
        )}

        <FormSection
          description="Identity and ordering in the public Project groups."
          id="basics-heading"
          title="Basics"
        >
          <div className="form-grid">
            <TextField
              error={errors.number}
              id="number"
              label="Display number"
              onChange={(next) => update("number", next)}
              required
              value={value.number}
            />
            <TextField
              error={errors.name}
              id="name"
              label="Project name"
              onChange={(next) => update("name", next)}
              required
              value={value.name}
            />
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                onChange={(event) =>
                  update(
                    "category",
                    event.target.value as ProjectFormValue["category"],
                  )
                }
                value={value.category}
              >
                {PROJECT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <TextField
              error={errors.groupOrder}
              id="groupOrder"
              label="Order within category"
              onChange={(next) => update("groupOrder", next)}
              required
              type="number"
              value={value.groupOrder}
            />
          </div>
        </FormSection>

        <FormSection
          description="The concise description shown when the Project is listed."
          id="summary-heading"
          title="Summary"
        >
          <div className="form-field">
            <label htmlFor="description">Short description *</label>
            <textarea
              aria-describedby={
                errors.description ? "description-error" : undefined
              }
              aria-invalid={errors.description ? "true" : undefined}
              id="description"
              onChange={(event) => update("description", event.target.value)}
              required
              rows={4}
              value={value.description}
            />
            {errors.description && (
              <span className="field-error" id="description-error">
                {errors.description}
              </span>
            )}
          </div>
          <TextField
            id="role"
            label="Role (optional)"
            onChange={(next) => update("role", next)}
            value={value.role}
          />
        </FormSection>

        <FormSection
          description="Keep the display order intentional; one technology per line is easiest to scan."
          id="technologies-heading"
          title="Technologies"
        >
          <div className="form-field">
            <label htmlFor="tech">Technologies *</label>
            <textarea
              aria-describedby={`tech-help${errors.tech ? " tech-error" : ""}`}
              aria-invalid={errors.tech ? "true" : undefined}
              id="tech"
              onChange={(event) => update("tech", event.target.value)}
              required
              rows={5}
              value={value.tech}
            />
            <span className="field-help" id="tech-help">
              One per line or separated by commas. Order is preserved.
            </span>
            {errors.tech && (
              <span className="field-error" id="tech-error">
                {errors.tech}
              </span>
            )}
          </div>
        </FormSection>

        <FormSection
          description="Optional external destinations must use complete HTTP or HTTPS URLs."
          id="links-heading"
          title="Links"
        >
          <div className="form-grid">
            <TextField
              error={errors.repo}
              id="repo"
              label="Repository URL (optional)"
              onChange={(next) => update("repo", next)}
              type="url"
              value={value.repo}
            />
            <TextField
              error={errors.liveUrl}
              id="liveUrl"
              label="Live site URL (optional)"
              onChange={(next) => update("liveUrl", next)}
              type="url"
              value={value.liveUrl}
            />
          </div>
        </FormSection>

        <FormSection
          description="The slug identifies the detail route; Markdown remains source text until publishing."
          id="details-heading"
          title="Detail content"
        >
          <TextField
            error={errors.slug}
            id="slug"
            label="Slug"
            onChange={(next) => update("slug", next)}
            required
            value={value.slug}
          />
          <div className="form-field">
            <label htmlFor="longDescriptionMarkdown">
              Long description Markdown (optional)
            </label>
            <textarea
              aria-describedby={
                errors.longDescriptionMarkdown
                  ? "longDescriptionMarkdown-error"
                  : "markdown-help"
              }
              aria-invalid={errors.longDescriptionMarkdown ? "true" : undefined}
              id="longDescriptionMarkdown"
              onChange={(event) =>
                update("longDescriptionMarkdown", event.target.value)
              }
              rows={10}
              value={value.longDescriptionMarkdown}
            />
            <span className="field-help" id="markdown-help">
              Source only. Markdown preview and publishing are outside this
              stage.
            </span>
            {errors.longDescriptionMarkdown && (
              <span className="field-error" id="longDescriptionMarkdown-error">
                {errors.longDescriptionMarkdown}
              </span>
            )}
          </div>
        </FormSection>

        <div className="form-actions">
          <span className="form-draft-status" role="status">
            {statusLabel}
          </span>
          <button
            className="button button--primary"
            disabled={submitDisabled}
            type="submit"
          >
            {isSaving ? "Saving…" : "Save Draft"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
