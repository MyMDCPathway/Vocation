"use client";

import { useState } from "react";
import { passwordStrength } from "@/app/lib/passwordStrength";

// A password input with a show/hide toggle — standard practice on every
// major site's account forms, and a real accessibility/usability win: typing
// a password blind into a tiny box is the single most common source of
// signup/login typos. Signup renders two of these (password, confirm
// password) and checks they match client-side before submitting; the show/hide
// toggle here is what makes actually comparing them by eye possible.
//
// showStrength (signup only, not login) renders passwordStrength()'s meter
// live as the student types — client-side feedback that mirrors, but never
// replaces, the server's own check in /api/signup/route.ts. See
// passwordStrength.ts for why this follows NIST 800-63B (length + a
// common-password check) rather than requiring a symbol/uppercase mix.

const STRENGTH_BAR_COLOR: Record<number, string> = {
  0: "bg-danger",
  1: "bg-danger",
  2: "bg-outline",
  3: "bg-secondary",
  4: "bg-secondary",
};

export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  helpText,
  showStrength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  helpText?: string;
  showStrength?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const strength = showStrength && value ? passwordStrength(value) : null;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-on-surface-variant">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type={visible ? "text" : "password"}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded border border-outline-variant bg-surface-lowest px-3 py-2 pr-10 text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          // h-8 w-8 (32px) meets the 24x24 CSS px minimum target size (WCAG
          // 2.5.8) the bare icon alone didn't — the icon itself stays the
          // same visual size, centered inside the larger hit area.
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-outline transition-colors hover:text-on-surface"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      {helpText && !strength && (
        <p className="mt-1 text-xs text-on-surface-variant">{helpText}</p>
      )}

      {strength && (
        <div className="mt-2">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < strength.score ? STRENGTH_BAR_COLOR[strength.score] : "bg-outline-variant"
                }`}
              />
            ))}
          </div>
          <p className={`mt-1 text-xs ${strength.blocked ? "text-error" : "text-on-surface-variant"}`}>
            {strength.label} — {strength.feedback}
          </p>
        </div>
      )}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
      <path d="M1.5 12s3.75-7.5 10.5-7.5S22.5 12 22.5 12s-3.75 7.5-10.5 7.5S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58a3 3 0 0 0 4.24 4.24" />
      <path d="M9.88 4.68A10.7 10.7 0 0 1 12 4.5c6.75 0 10.5 7.5 10.5 7.5a13.15 13.15 0 0 1-3.05 3.99M6.5 6.5C3.87 8.16 1.5 12 1.5 12s3.75 7.5 10.5 7.5a10.7 10.7 0 0 0 4.02-.78" />
    </svg>
  );
}
