import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  PROJECT_CATEGORIES,
  type ProjectFormErrors,
  type ProjectFormValue,
} from "./project-contract";

type ProjectFormProps = {
  readonly availableImages: readonly {
    readonly id: string;
    readonly originalFilename: string;
    readonly previewUrl: string;
  }[];
  readonly disabled: boolean;
  readonly errors: ProjectFormErrors;
  readonly isSaving: boolean;
  readonly onChange: (value: ProjectFormValue) => void;
  readonly onUploadImage: (file: File) => Promise<{
    readonly id: string;
    readonly originalFilename: string;
  }>;
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
  availableImages,
  disabled,
  errors,
  isSaving,
  onChange,
  onSubmit,
  onUploadImage,
  statusLabel,
  submitDisabled,
  value,
}: ProjectFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const errorCount = Object.keys(errors).length;
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

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

  function moveGalleryItem(from: number, to: number) {
    const gallery = [...value.gallery];
    const [item] = gallery.splice(from, 1);
    if (item === undefined) return;
    gallery.splice(to, 0, item);
    update("gallery", gallery);
  }

  async function uploadGalleryImage(file: File | undefined) {
    if (file === undefined || value.gallery.length >= 5) return;
    setIsUploadingImage(true);
    setUploadNotice("Uploading and verifying the screenshotâ€¦");
    try {
      const asset = await onUploadImage(file);
      update("gallery", [
        ...value.gallery,
        {
          mediaId: asset.id,
          altText: "",
          isCover: value.gallery.length === 0,
        },
      ]);
      setUploadNotice(
        `${asset.originalFilename} was added. Add alt text, then Save Draft.`,
      );
    } catch (error) {
      setUploadNotice(
        error instanceof Error ? error.message : "Upload failed.",
      );
    } finally {
      setIsUploadingImage(false);
    }
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

        <FormSection
          description="Select up to five ready images. Every image needs alt text and one image must be the cover."
          id="gallery-heading"
          title="Project gallery"
        >
          <div className="form-actions">
            <label className="button button--secondary">
              Upload screenshot
              <input
                accept="image/jpeg,image/png,image/webp"
                disabled={isUploadingImage || value.gallery.length >= 5}
                hidden
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  void uploadGalleryImage(file);
                }}
                type="file"
              />
            </label>
          </div>
          {uploadNotice ? <p role="status">{uploadNotice}</p> : null}
          {errors.gallery ? (
            <span className="field-error" role="alert">
              {errors.gallery}
            </span>
          ) : null}
          <div className="content-array-list">
            {value.gallery.map((item, index) => {
              const asset = availableImages.find(
                ({ id }) => id === item.mediaId,
              );
              return (
                <article className="content-array-card" key={item.mediaId}>
                  <strong>{asset?.originalFilename ?? item.mediaId}</strong>
                  {asset ? (
                    <img
                      alt=""
                      className="project-gallery-preview"
                      loading="lazy"
                      src={asset.previewUrl}
                    />
                  ) : null}
                  <label className="form-field">
                    Alt text *
                    <input
                      onChange={(event) =>
                        update(
                          "gallery",
                          value.gallery.map((entry, entryIndex) =>
                            entryIndex === index
                              ? { ...entry, altText: event.target.value }
                              : entry,
                          ),
                        )
                      }
                      value={item.altText}
                    />
                  </label>
                  <label>
                    <input
                      checked={item.isCover}
                      name="project-cover"
                      onChange={() =>
                        update(
                          "gallery",
                          value.gallery.map((entry, entryIndex) => ({
                            ...entry,
                            isCover: entryIndex === index,
                          })),
                        )
                      }
                      type="radio"
                    />{" "}
                    Cover image
                  </label>
                  <div className="content-row-actions">
                    <button
                      disabled={index === 0}
                      onClick={() => moveGalleryItem(index, index - 1)}
                      type="button"
                    >
                      Move up
                    </button>
                    <button
                      disabled={index === value.gallery.length - 1}
                      onClick={() => moveGalleryItem(index, index + 1)}
                      type="button"
                    >
                      Move down
                    </button>
                    <button
                      onClick={() =>
                        update(
                          "gallery",
                          value.gallery
                            .filter((_, entryIndex) => entryIndex !== index)
                            .map((entry, entryIndex) => ({
                              ...entry,
                              isCover: entryIndex === 0,
                            })),
                        )
                      }
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          {value.gallery.length === 0 ? (
            <p>No screenshots attached. Use Upload screenshot to add one.</p>
          ) : null}
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
