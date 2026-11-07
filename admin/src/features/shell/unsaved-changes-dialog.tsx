import { TriangleAlert } from "lucide-react";

import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../components/ui/dialog";

type UnsavedChangesDialogProps = {
  readonly action: "leave" | "logout";
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly open: boolean;
};

export function UnsavedChangesDialog({
  action,
  onCancel,
  onConfirm,
  open,
}: UnsavedChangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent aria-describedby="unsaved-description">
        <div className="dialog-heading">
          <div className="dialog-icon" aria-hidden="true">
            <TriangleAlert size={18} />
          </div>
          <DialogTitle>Discard unsaved changes?</DialogTitle>
        </div>
        <DialogDescription id="unsaved-description">
          Your unsaved Admin changes will be lost. Saved drafts and published
          content will not be affected.
        </DialogDescription>
        <div className="dialog-actions">
          <Button onClick={onCancel} type="button" variant="outline">
            Keep editing
          </Button>
          <Button onClick={onConfirm} type="button" variant="destructive">
            {action === "logout" ? "Discard and log out" : "Discard and leave"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
