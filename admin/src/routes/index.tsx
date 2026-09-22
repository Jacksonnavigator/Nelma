import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Droplets, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NELMA | Sign In" },
      {
        name: "description",
        content: "Sign in to the NELMA drinking water management portal for sales and admin staff.",
      },
      { property: "og:title", content: "NELMA | Sign In" },
      {
        property: "og:description",
        content: "Sign in to the NELMA drinking water management portal.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { status, signIn } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") navigate({ to: "/dashboard", replace: true });
  }, [status, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await signIn(identifier, password);
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      const message =
        typeof err === "object" && err && "message" in err
          ? String((err as { message: unknown }).message)
          : "Sign in failed. Please try again.";
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden flex-1 flex-col justify-between bg-sidebar p-10 lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Droplets className="size-5" />
          </span>
          <div>
            <p className="text-base font-semibold tracking-tight text-sidebar-foreground">NELMA</p>
            <p className="text-xs text-muted-foreground">Management Portal</p>
          </div>
        </div>
        <div className="max-w-md">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Drinking water operations, under control.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Track orders, coordinate deliveries and drivers, manage pricing, and review sales — all
            from one operational workspace.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Internal staff access only.</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Droplets className="size-5" />
            </span>
            <div>
              <p className="text-base font-semibold tracking-tight text-foreground">NELMA</p>
              <p className="text-xs text-muted-foreground">Management Portal</p>
            </div>
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-foreground">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your staff email or phone number to continue.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or phone</Label>
              <Input
                id="identifier"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@nelma.example"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error ? (
              <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Sign In
            </Button>
          </form>
          <Link to="/reset-password" className="mt-4 block text-sm text-primary underline">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
