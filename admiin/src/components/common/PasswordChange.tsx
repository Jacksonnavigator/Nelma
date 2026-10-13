import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { isApiError, DATA_MODE } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function PasswordChange() {
  const { signOut } = useAuth();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const mutation = useMutation({
    mutationFn: () => authService.changePassword({ currentPassword, newPassword, confirmPassword }),
    onSuccess: async () => {
      setCurrent("");
      setNew("");
      setConfirm("");
      toast.success("Password changed. Please sign in again.");
      await signOut().catch(() => undefined);
    },
  });
  if (DATA_MODE !== "api")
    return (
      <p className="text-sm text-muted-foreground">
        Password changes are available when connected to the backend.
      </p>
    );
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!mutation.isPending && newPassword === confirmPassword) mutation.mutate();
      }}
    >
      <fieldset disabled={mutation.isPending} className="space-y-4">
        {(
          [
            ["current-password", "Current password", currentPassword, setCurrent],
            ["new-password", "New password", newPassword, setNew],
            ["confirm-password", "Confirm new password", confirmPassword, setConfirm],
          ] as const
        ).map(([id, label, value, update]) => (
          <div key={id} className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Input
              id={id}
              type="password"
              autoComplete={id === "current-password" ? "current-password" : "new-password"}
              required
              minLength={8}
              maxLength={128}
              value={value}
              onChange={(e) => update(e.target.value)}
            />
          </div>
        ))}
        {confirmPassword && newPassword !== confirmPassword && (
          <p role="alert" className="text-sm text-destructive">
            Passwords must match.
          </p>
        )}
        {mutation.isError && (
          <p role="alert" className="text-sm text-destructive">
            {isApiError(mutation.error) ? mutation.error.message : "Could not change password."}
          </p>
        )}
        <Button disabled={mutation.isPending || !newPassword || newPassword !== confirmPassword}>
          {mutation.isPending ? "Changing..." : "Change password"}
        </Button>
      </fieldset>
    </form>
  );
}
