import { RotateCcw, Save } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { OperationAlert } from "../shell/operation-alert";
import { ContextualMediaField } from "../media/contextual-media-field";
import type {
  AboutDocument,
  ContactDocument,
  EditableContentSectionKey,
  HeroDocument,
  TechnologiesDocument,
  TimelineDocument,
} from "./content-contract";
import { createContentClient } from "./content-client";
import { ContentEditorSkeleton } from "./content-editor-skeleton";
import {
  AboutFields,
  ContactFields,
  HeroFields,
  TechnologiesFields,
  TimelineFields,
} from "./content-editor-fields";
import { useContentEditor } from "./use-content-editor";

type TextContentSectionKey = Exclude<EditableContentSectionKey, "media-resume">;

const titles = {
  hero: {
    title: "Hero",
    description: "Manage your name, role, location, and introduction.",
  },
  about: {
    title: "About Me",
    description: "Manage your biography and personal facts.",
  },
  timeline: {
    title: "Timeline",
    description: "Manage ordered experience and education entries.",
  },
  technologies: {
    title: "Technologies",
    description: "Manage ordered categories, skills, and built-in icons.",
  },
  contact: {
    title: "Contact",
    description: "Manage availability, contact details, and social links.",
  },
} as const;

export function ContentEditorPage({
  apiOrigin,
  csrfToken,
  onDiscardReady,
  onDirtyChange,
  onUnauthorized,
  sectionKey,
}: {
  readonly apiOrigin: string;
  readonly csrfToken: string;
  readonly onDiscardReady: (discard: () => void) => void;
  readonly onDirtyChange: (dirty: boolean) => void;
  readonly onUnauthorized: () => void;
  readonly sectionKey: TextContentSectionKey;
}) {
  const client = useMemo(() => createContentClient(apiOrigin), [apiOrigin]);
  const editor = useContentEditor({
    client,
    csrfToken,
    onUnauthorized,
    sectionKey,
  });
  const [mediaDirty, setMediaDirty] = useState(false);
  const discardMedia = useRef<() => void>(() => undefined);
  const discardContent = editor.discardChanges;

  useEffect(() => {
    onDirtyChange(editor.dirty || mediaDirty);
    return () => onDirtyChange(false);
  }, [editor.dirty, mediaDirty, onDirtyChange]);
  useEffect(() => {
    onDiscardReady(() => {
      discardContent();
      discardMedia.current();
    });
    return () => onDiscardReady(() => undefined);
  }, [discardContent, onDiscardReady]);

  if (editor.isLoading && editor.document === null)
    return (
      <main className="content-workspace">
        <header className="content-page-header">
          <div>
            <h1>{titles[sectionKey].title}</h1>
            <p>{titles[sectionKey].description}</p>
          </div>
          <Skeleton className="h-6 w-28 rounded-full" />
        </header>
        <ContentEditorSkeleton sectionKey={sectionKey} />
      </main>
    );
  if (editor.document === null)
    return (
      <main className="content-workspace">
        <div className="page-heading">
          <h1>{titles[sectionKey].title}</h1>
        </div>
        {editor.notice ? <OperationAlert {...editor.notice} /> : null}
        <Button
          onClick={() => void editor.load()}
          type="button"
          variant="outline"
        >
          <RotateCcw /> Retry
        </Button>
      </main>
    );

  return (
    <main className="content-workspace">
      <header className="content-page-header">
        <div>
          <h1>{titles[sectionKey].title}</h1>
          <p>{titles[sectionKey].description}</p>
        </div>
        <span className="content-status">
          {editor.section?.isPublished
            ? "Published version exists"
            : "Not published yet"}
        </span>
      </header>
      {editor.notice ? <OperationAlert {...editor.notice} /> : null}
      {editor.conflict ? (
        <section className="content-conflict" role="alert">
          <h2>Choose the draft to continue editing</h2>
          <p>The saved version changed after this page loaded.</p>
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={editor.useSavedConflict}
            >
              Use latest saved
            </Button>
            <Button type="button" onClick={editor.keepConflictEdits}>
              Keep my edits
            </Button>
          </div>
        </section>
      ) : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void editor.save();
        }}
      >
        {sectionKey === "hero" ? (
          <HeroFields
            document={editor.document as HeroDocument}
            errors={editor.errors}
            onChange={editor.setDocument}
          />
        ) : sectionKey === "about" ? (
          <AboutFields
            document={editor.document as AboutDocument}
            errors={editor.errors}
            onChange={editor.setDocument}
          />
        ) : sectionKey === "timeline" ? (
          <TimelineFields
            document={editor.document as TimelineDocument}
            errors={editor.errors}
            onChange={editor.setDocument}
          />
        ) : sectionKey === "technologies" ? (
          <TechnologiesFields
            document={editor.document as TechnologiesDocument}
            errors={editor.errors}
            onChange={editor.setDocument}
          />
        ) : (
          <ContactFields
            document={editor.document as ContactDocument}
            errors={editor.errors}
            onChange={editor.setDocument}
          />
        )}
        {sectionKey === "hero" ? (
          <ContextualMediaField
            apiOrigin={apiOrigin}
            csrfToken={csrfToken}
            defaultLabel="Use bundled résumé"
            description="Upload the PDF downloaded from the Hero button. A successful upload is selected automatically."
            field="resumeMediaId"
            kind="resume_pdf"
            onDiscardReady={(discard) => {
              discardMedia.current = discard;
            }}
            onDirtyChange={setMediaDirty}
            onUnauthorized={onUnauthorized}
            title="Résumé"
            uploadLabel="Replace résumé"
          />
        ) : sectionKey === "about" ? (
          <ContextualMediaField
            apiOrigin={apiOrigin}
            csrfToken={csrfToken}
            defaultLabel="Use bundled profile image"
            description="Upload the image shown in About Me. A successful upload is selected automatically."
            field="profileImageMediaId"
            kind="image"
            onDiscardReady={(discard) => {
              discardMedia.current = discard;
            }}
            onDirtyChange={setMediaDirty}
            onUnauthorized={onUnauthorized}
            title="Profile image"
            uploadLabel="Replace profile image"
          />
        ) : null}
        <div className="content-save-bar">
          <span>
            {editor.dirty
              ? "Unsaved changes"
              : `Draft revision ${editor.section?.revision ?? "—"}`}
          </span>
          <div>
            <Button
              disabled={
                !editor.dirty ||
                editor.isSaving ||
                editor.pendingOperationId !== null
              }
              type="button"
              variant="outline"
              onClick={editor.discardChanges}
            >
              Discard
            </Button>
            {editor.pendingOperationId ? (
              <Button
                disabled={editor.isSaving}
                type="button"
                variant="outline"
                onClick={() => void editor.checkUnresolved()}
              >
                Check save
              </Button>
            ) : null}
            <Button
              disabled={
                !editor.dirty ||
                editor.isSaving ||
                editor.pendingOperationId !== null
              }
              type="submit"
            >
              <Save />
              {editor.isSaving ? "Saving…" : "Save Draft"}
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}
