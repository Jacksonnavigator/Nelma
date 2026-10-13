import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { DATA_MODE, isApiError } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "NELMA | Reset password" }] }),
  component: ResetPassword,
});
function ResetPassword() {
  const { signOut } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [resetToken, setToken] = useState("");
  const [newPassword, setPassword] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [sent, setSent] = useState(false);
  const request = useMutation({
    mutationFn: () => authService.forgotPassword(identifier.trim()),
    onSuccess: () => setSent(true),
  });
  const reset = useMutation({
    mutationFn: () =>
      authService.resetPassword({
        identifier: identifier.trim(),
        resetToken: resetToken.trim(),
        newPassword,
        confirmPassword,
      }),
    onSuccess: async () => {
      await signOut().catch(() => undefined);
      setToken("");
      setPassword("");
      setConfirm("");
    },
  });
  const error = request.error ?? reset.error;
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-5 rounded-xl border bg-card p-6">
        <h1 className="text-xl font-semibold">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your registered email for an email code, or your phone number for an SMS code.
        </p>
        {DATA_MODE !== "api" ? (
          <p>Password reset is available when connected to the backend.</p>
        ) : reset.isSuccess ? (
          <p role="status">Password reset. You can sign in with your new password.</p>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (request.isPending || reset.isPending) return;
              if (!sent) request.mutate();
              else if (newPassword === confirmPassword) reset.mutate();
            }}
          >
            <fieldset disabled={request.isPending || reset.isPending} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reset-identifier">Email or phone</Label>
                <Input
                  id="reset-identifier"
                  autoComplete="username"
                  required
                  minLength={3}
                  value={identifier}
                  readOnly={sent}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
              {sent && (
                <>
                  <p role="status" className="text-sm text-muted-foreground">
                    If the account exists, a reset code has been sent. Enter it below.
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-code">Reset code</Label>
                    <Input
                      id="reset-code"
                      autoComplete="one-time-code"
                      required
                      minLength={4}
                      maxLength={32}
                      value={resetToken}
                      onChange={(e) => setToken(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-new">New password</Label>
                    <Input
                      id="reset-new"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={128}
                      value={newPassword}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-confirm">Confirm new password</Label>
                    <Input
                      id="reset-confirm"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirm(e.target.value)}
                    />
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p role="alert" className="text-sm text-destructive">
                      Passwords must match.
                    </p>
                  )}
                </>
              )}
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {isApiError(error) ? error.message : "Please try again."}
                </p>
              )}
              <Button
                disabled={
                  request.isPending || reset.isPending || (sent && newPassword !== confirmPassword)
                }
              >
                {sent ? "Reset password" : "Send reset code"}
              </Button>
              {sent && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSent(false);
                    request.reset();
                    reset.reset();
                  }}
                >
                  Use another account or request a new code
                </Button>
              )}
            </fieldset>
          </form>
        )}
        <Link to="/" className="block text-sm text-primary underline">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
