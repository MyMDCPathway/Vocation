"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// The Account Settings the profile menu used to point at with no page
// behind it. Three real fields: display name, privacy visibility (the PRD's
// "Private, Mentors Only, Public" — User.privacyVisibility existed since the
// schema was written but nothing ever wrote to it from a settings screen),
// and location (reuses /api/profile/location, the same store the intake
// reads to skip its own location question for a returning student).
//
// Email is shown, not editable — it's the sign-in identity Auth.js keys
// everything on, and changing it here would need its own verification flow
// this project doesn't have yet.

const VISIBILITY_OPTIONS: { value: string; label: string; detail: string }[] = [
  { value: "private", label: "Private", detail: "Only you can see your saved pathways." },
  { value: "mentors_only", label: "Mentors only", detail: "Visible to mentors you connect with." },
  { value: "public", label: "Public", detail: "Visible to anyone with the link." },
];

export default function AccountSettingsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [postalCode, setPostalCode] = useState("");
  const [countryCode, setCountryCode] = useState("");

  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const [settingsRes, locationRes] = await Promise.all([
          fetch("/api/account/settings"),
          fetch("/api/profile/location"),
        ]);
        const settings = await settingsRes.json();
        const location = await locationRes.json();
        if (settingsRes.ok) {
          setName(settings.name ?? "");
          setEmail(settings.email ?? "");
          setVisibility(settings.privacyVisibility ?? "private");
        }
        setPostalCode(location.postalCode ?? "");
        setCountryCode(location.countryCode ?? "");
      } catch {
        setError("Couldn't load your settings.");
      } finally {
        setLoaded(true);
      }
    })();
  }, [status]);

  async function saveProfile() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/account/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, privacyVisibility: visibility }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Couldn't save.");
      setMessage("Saved.");
    } catch (err: any) {
      setError(err.message || "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  async function saveLocation() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/profile/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postalCode, countryCode }),
      });
      if (!response.ok) throw new Error("Couldn't save your location.");
      setMessage("Saved.");
    } catch (err: any) {
      setError(err.message || "Couldn't save your location.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-outline-variant bg-surface px-5 py-4 md:px-16">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight text-primary">
            Vocation
          </Link>
          <Link href="/pathways" className="text-sm text-outline transition-colors hover:text-primary">
            ← Your pathways
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 md:px-16">
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">Account Settings</h1>

        {!loaded ? (
          <p className="mt-8 text-on-surface-variant">Loading…</p>
        ) : (
          <>
            {error && (
              <p className="mt-6 rounded-lg border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
                {error}
              </p>
            )}
            {message && <p className="mt-6 text-sm text-secondary">{message}</p>}

            <section className="mt-8 rounded-xl bg-surface-lowest p-6 shadow-card">
              <h2 className="text-lg font-semibold text-on-surface">Profile</h2>

              <label className="mt-4 block text-sm font-medium text-on-surface-variant">
                Name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </label>

              <label className="mt-4 block text-sm font-medium text-on-surface-variant">
                Email
                <input
                  type="email"
                  value={email}
                  disabled
                  className="mt-1 w-full cursor-not-allowed rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-sm text-on-surface-variant"
                />
              </label>
              <p className="mt-1 text-xs text-outline">
                Your email is how you sign in and can&apos;t be changed here.
              </p>

              <fieldset className="mt-5">
                <legend className="text-sm font-medium text-on-surface-variant">
                  Who can see your saved pathways
                </legend>
                <div className="mt-2 space-y-2">
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-start gap-2.5 text-sm">
                      <input
                        type="radio"
                        name="visibility"
                        value={opt.value}
                        checked={visibility === opt.value}
                        onChange={() => setVisibility(opt.value)}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="font-medium text-on-surface">{opt.label}</span>
                        <span className="block text-xs text-outline">{opt.detail}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="mt-5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                Save profile
              </button>
            </section>

            <section className="mt-6 rounded-xl bg-surface-lowest p-6 shadow-card">
              <h2 className="text-lg font-semibold text-on-surface">Location</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Saved here so a future intake can skip asking again — the
                same field the location step itself fills in.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <label className="text-sm font-medium text-on-surface-variant">
                  Postal code
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>
                <label className="text-sm font-medium text-on-surface-variant">
                  Country code
                  <input
                    type="text"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="US"
                    maxLength={2}
                    className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={saveLocation}
                disabled={saving}
                className="mt-5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                Save location
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
