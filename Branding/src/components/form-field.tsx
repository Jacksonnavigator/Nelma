import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CONSENT_ERROR } from "../lib/form-validation";

// A labelled field with its message underneath. The input goes inside; give it aria-invalid when there is an error.
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | null | undefined;
  children: ReactNode;
}) {
  return (
    <label className={error ? "has-error" : undefined}>
      {label}
      {children}
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

// The age and agreement tick-box that goes above the send button of every form.
export function ConsentCheck({
  checked,
  error,
  onChange,
}: {
  checked: boolean;
  error?: string | null | undefined;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className={error ? "consent-check has-error" : "consent-check"}>
      <label>
        <input
          type="checkbox"
          checked={checked}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          I am 18 or older, or I have a parent or guardian&apos;s permission, and I agree to the{" "}
          <Link to="/terms" target="_blank">
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link to="/privacy" target="_blank">
            Privacy Policy
          </Link>
          . *
        </span>
      </label>
      {error ? (
        <span className="field-error" role="alert">
          {error || CONSENT_ERROR}
        </span>
      ) : null}
    </div>
  );
}
