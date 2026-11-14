import { FileText, Image, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "../../components/ui/button";
import { AdminApiError } from "../../lib/admin-http";
import { createContentClient } from "../content/content-client";
import type { MediaResumeDocument } from "../content/content-contract";
import { useContentEditor } from "../content/use-content-editor";
import { OperationAlert } from "../shell/operation-alert";
import { createMediaClient, type MediaAsset } from "./media-client";

type MediaField = keyof MediaResumeDocument;

type ContextualMediaFieldProps = {
  readonly apiOrigin: string;
  readonly csrfToken: string;
  readonly defaultLabel: string;
  readonly description: string;
  readonly field: MediaField;
  readonly kind: MediaAsset["kind"];
  readonly onDiscardReady: (discard: () => void) => void;
  readonly onDirtyChange: (dirty: boolean) => void;
  readonly onUnauthorized: () => void;
  readonly title: string;
  readonly uploadLabel: string;
};

export function ContextualMediaField({
  apiOrigin,
  csrfToken,
  defaultLabel,
  description,
  field,
  kind,
  onDiscardReady,
  onDirtyChange,
  onUnauthorized,
  title,
  uploadLabel,
}: ContextualMediaFieldProps) {
  const contentClient = useMemo(
    () => createContentClient(apiOrigin),
    [apiOrigin],
  );
  const mediaClient = useMemo(() => createMediaClient(apiOrigin), [apiOrigin]);
  const editor = useContentEditor({
    client: contentClient,
    csrfToken,
    onUnauthorized,
    sectionKey: "media-resume",
  });
  const [assets, setAssets] = useState<readonly MediaAsset[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const document = editor.document as MediaResumeDocument | null;
  const selectedId = document?.[field] ?? null;
  const selectedAsset = assets.find(({ id }) => id === selectedId) ?? null;
  const accept =
    kind === "resume_pdf"
      ? "application/pdf"
      : "image/jpeg,image/png,image/webp";

  useEffect(() => {
    onDirtyChange(editor.dirty);
    return () => onDirtyChange(false);
  }, [editor.dirty, onDirtyChange]);

  useEffect(() => {
    onDiscardReady(editor.discardChanges);
    return () => onDiscardReady(() => undefined);
  }, [editor.discardChanges, onDiscardReady]);

  useEffect(() => {
    void mediaClient
      .list()
      .then((items) => setAssets(items.filter((asset) => asset.kind === kind)))
      .catch((error: unknown) => {
        if (error instanceof AdminApiError && error.status === 401)
          onUnauthorized();
        else setNotice("Uploaded media could not be loaded.");
      });
  }, [kind, mediaClient, onUnauthorized]);

  function select(mediaId: string | null) {
    if (document !== null)
      editor.setDocument({ ...document, [field]: mediaId });
  }

  async function upload(file: File | undefined) {
    if (file === undefined || document === null) return;
    setIsUploading(true);
    setNotice("Uploading and verifying the fileâ€¦");
    try {
      const asset = await mediaClient.upload(file, csrfToken);
      setAssets((current) => [...current, asset]);
      editor.setDocument({ ...document, [field]: asset.id });
      setNotice("Upload verified and selected. Save this media draft.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section
      className="content-form-section"
      aria-labelledby={`${field}-title`}
    >
      <div>
        <h2 id={`${field}-title`}>{title}</h2>
        <p>{description}</p>
      </div>
      {editor.notice ? <OperationAlert {...editor.notice} /> : null}
      {notice ? <p role="status">{notice}</p> : null}
      <div className="form-actions">
        <label className="button button--secondary">
          {kind === "resume_pdf" ? (
            <FileText aria-hidden="true" size={16} />
          ) : (
            <Image aria-hidden="true" size={16} />
          )}
          {uploadLabel}
          <input
            accept={accept}
            disabled={isUploading || document === null}
            hidden
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              void upload(file);
            }}
            type="file"
          />
        </label>
        {selectedAsset ? (
          <a
            className="button button--secondary"
            href={mediaClient.fileUrl(selectedAsset.id)}
            rel="noreferrer"
            target="_blank"
          >
            <Upload aria-hidden="true" size={16} /> Open current file
          </a>
        ) : null}
        <Button
          disabled={selectedId === null || document === null}
          onClick={() => select(null)}
          type="button"
          variant="outline"
        >
          {defaultLabel}
        </Button>
      </div>
      <p>Current: {selectedAsset?.originalFilename ?? defaultLabel}</p>
      {selectedAsset ? (
        <div className="media-preview">
          {selectedAsset.kind === "image" ? (
            <img
              alt="Current profile image preview"
              loading="lazy"
              src={mediaClient.fileUrl(selectedAsset.id)}
            />
          ) : (
            <iframe
              loading="lazy"
              src={mediaClient.fileUrl(selectedAsset.id)}
              title="Current résumé preview"
            />
          )}
        </div>
      ) : null}
      <div className="form-actions">
        {editor.pendingOperationId ? (
          <Button
            disabled={editor.isSaving}
            onClick={() => void editor.checkUnresolved()}
            type="button"
            variant="outline"
          >
            Check save
          </Button>
        ) : null}
        <Button
          disabled={
            !editor.dirty ||
            editor.isSaving ||
            editor.pendingOperationId !== null ||
            isUploading
          }
          onClick={() => void editor.save()}
          type="button"
        >
          {editor.isSaving ? "Savingâ€¦" : `Save ${title} Draft`}
        </Button>
      </div>
    </section>
  );
}
