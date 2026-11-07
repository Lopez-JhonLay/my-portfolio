import { CircleCheck, Info, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription } from "../../components/ui/alert";

type OperationAlertProps = {
  readonly kind: "error" | "info" | "success" | "warning";
  readonly message: string;
};

export function OperationAlert({ kind, message }: OperationAlertProps) {
  const Icon =
    kind === "success" ? CircleCheck : kind === "info" ? Info : TriangleAlert;
  const variant = kind === "error" ? "destructive" : kind;

  return (
    <Alert role={kind === "error" ? "alert" : "status"} variant={variant}>
      <Icon aria-hidden="true" />
      <AlertDescription className="text-current">{message}</AlertDescription>
    </Alert>
  );
}
