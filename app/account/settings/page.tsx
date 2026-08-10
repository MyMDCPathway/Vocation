"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// The Account Settings the profile menu used to point at with no page
// behind it. One editable field: display name. Privacy visibility and a
// stored location both used to live here, but neither changed anything a
// student could observe — nothing reads privacyVisibility, and the intake
// already collects and writes location itself — so a settings screen was
// only offering control that didn't exist.
//
// Email is shown, not editable — it's the sign-in identity Auth.js keys
// everything on, and changing it here would need its own verification flow
// this project doesn't have yet.

export default function AccountSettingsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

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
        const settingsRes = await fetch("/api/account/settings");
        const settings = await settingsRes.json();
        if (settingsRes.ok) {
          setName(settings.name ?? "");
          setEmail(settings.email ?? "");
        }
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
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Couldn't save.");
      setMessage("Saved.");
    } catch (err: any) {
      setError(err.message || "Couldn't save.");
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

              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="mt-5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                Save profile
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
