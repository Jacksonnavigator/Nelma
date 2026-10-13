import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Eye, EyeOff, ArrowRight, LockKeyhole } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="grid min-h-svh bg-card lg:grid-cols-[1.05fr_1fr]">
      <section
        className="login-story hidden flex-col justify-between p-12 lg:flex xl:p-16"
        aria-label="About the NELMA management portal"
      >
        <div className="login-logo">
          <img
            src="/brand/nelma-logo.png"
            alt="NELMA, Maji Safi na Salama"
            width={176}
            height={80}
            className="h-auto w-44"
          />
        </div>
        <div className="my-12 max-w-lg">
          <h2 className="text-[64px] font-semibold leading-[1.02] tracking-[-.045em]">
            Water,
            <br />
            in motion.
          </h2>
          <p className="login-story-copy mt-8 max-w-sm text-xl leading-relaxed">
            Your orders. Your drivers.
            <br />
            One connected workspace.
          </p>
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 text-base">
            <span>Take the order</span>
            <span>Plan the delivery</span>
            <span>Keep it moving</span>
          </div>
        </div>
        <p className="login-story-copy text-base">Maji Safi na Salama · NELMA Drinking Water</p>
      </section>
      <main className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <img src="/brand/nelma-icon.png" alt="" className="size-11 object-contain" />
            <div>
              <p className="text-lg font-bold tracking-wider">NELMA</p>
            </div>
          </div>
          <h1 className="text-[36px] font-semibold leading-tight tracking-[-.04em] text-foreground">
            Welcome back.
          </h1>
          <p className="mt-3 text-base text-muted-foreground">Sign in to your NELMA workspace.</p>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit} aria-busy={submitting}>
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or phone number</Label>
              <Input
                id="identifier"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your staff email or phone"
                disabled={submitting}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/reset-password"
                  className="flex min-h-11 items-center text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pr-12"
                  disabled={submitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-0 top-0 flex size-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
          <div className="mt-8 pt-6">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LockKeyhole className="size-4" />
              For authorized NELMA staff only.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Need access? Contact your system administrator.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
