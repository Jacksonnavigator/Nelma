import { PasswordChange } from "@/components/common/PasswordChange";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { ContactFields, type ContactValues } from "@/components/common/ContactFields";
import { RoleBadge } from "@/components/common/RoleBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services";
import { isApiError } from "@/services/api";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "NELMA | Profile" }] }),
  component: ProfilePage,
});
function ProfilePage() {
  const { user, setUser, signOut } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<ContactValues | null>(null);
  const save = useMutation({
    mutationFn: (input: ContactValues) => authService.updateProfile(input),
    onSuccess: (updated) => {
      setUser(updated);
      setDraft(null);
      void qc.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Profile saved");
    },
  });
  if (!user) return null;
  const value = draft ?? user;
  const dirty = ["fullName", "email", "phone"].some(
    (key) => value[key as keyof ContactValues] !== user[key as keyof ContactValues],
  );
  return (
    <div className="space-y-5">
      <PageHeader title="Profile" description="Manage your personal contact details." />
      <div className="max-w-2xl rounded-xl border bg-card p-6 shadow-card">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-semibold">Your account</h2>
          <RoleBadge role={user.role} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (dirty && !save.isPending)
              save.mutate({
                fullName: value.fullName.trim(),
                email: value.email.trim(),
                phone: value.phone.trim(),
              });
          }}
        >
          <fieldset disabled={save.isPending} className="space-y-5">
            <ContactFields value={value} onChange={setDraft} />
            <p className="text-sm text-muted-foreground">
              Your role and account access are managed by a system administrator.
            </p>
            {save.isError && (
              <p role="alert" className="text-sm text-destructive">
                {isApiError(save.error)
                  ? save.error.message
                  : "Could not save your profile. Please try again."}
              </p>
            )}
            <div className="flex gap-2">
              <Button disabled={!dirty || save.isPending}>
                {save.isPending ? "Saving..." : "Save profile"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!dirty}
                onClick={() => {
                  setDraft(null);
                  save.reset();
                }}
              >
                Cancel
              </Button>
            </div>
          </fieldset>
        </form>
      </div>
      <section className="max-w-2xl space-y-3 rounded-xl border bg-card p-6">
        <h2 className="font-semibold">Security</h2>
        <PasswordChange />
        <Button
          variant="outline"
          onClick={() => {
            void signOut().catch(() => toast.error("Could not sign out. Please try again."));
          }}
        >
          Log out
        </Button>
      </section>
    </div>
  );
}
