import { RotateCcw, Save } from "lucide-react";
import { useEffect, useMemo } from "react";

import { Button } from "../../components/ui/button";
import { OperationAlert } from "../shell/operation-alert";
import type {
  AboutDocument,
  ContactDocument,
  EditableContentSectionKey,
  HeroDocument,
} from "./content-contract";
import { createContentClient } from "./content-client";
import {
  AboutFields,
  ContactFields,
  HeroFields,
} from "./content-editor-fields";
import { useContentEditor } from "./use-content-editor";

const titles = {
  hero: {
    title: "Hero",
    description:
      "Manage site identity, navigation labels, and the opening message.",
  },
  about: {
    title: "About Me",
    description: "Manage the profile framing, biography, and personal facts.",
  },
  contact: {
    title: "Contact",
    description: "Manage contact details, social links, and footer copy.",
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
  readonly sectionKey: EditableContentSectionKey;
}) {
  const client = useMemo(() => createContentClient(apiOrigin), [apiOrigin]);
  const editor = useContentEditor({
    client,
    csrfToken,
    onUnauthorized,
    sectionKey,
  });

  useEffect(() => {
    onDirtyChange(editor.dirty);
    return () => onDirtyChange(false);
  }, [editor.dirty, onDirtyChange]);
  useEffect(() => {
    onDiscardReady(editor.discardChanges);
    return () => onDiscardReady(() => undefined);
  }, [editor.discardChanges, onDiscardReady]);

  if (editor.isLoading && editor.document === null)
    return (
      <main className="workspace-loading" role="status">
        <h1>{titles[sectionKey].title}</h1>
        <span>Loading draft…</span>
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
        ) : (
          <ContactFields
            document={editor.document as ContactDocument}
            errors={editor.errors}
            onChange={editor.setDocument}
          />
        )}
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
