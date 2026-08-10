"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
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

  const [downloading, setDownloading] = useState(false);

  // The danger zone is closed by default and has its own error slot: a failed
  // deletion must report itself next to the button that failed, not in the
  // banner at the top of the page where a student mid-confirmation won't see it.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  // Fetched rather than linked with a plain <a download>. The route can answer
  // 401 or 429, and an anchor would navigate the student to raw JSON error text
  // instead of telling them what happened; going through fetch keeps failures
  // on this page.
  async function downloadData() {
    setDownloading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/account/export");
      if (!response.ok) {
        throw new Error((await response.json()).error || "Couldn't prepare your download.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vocation-data-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      // The blob is held in memory until it's revoked, and this one contains
      // the whole account.
      URL.revokeObjectURL(url);
      setMessage("Your data is downloading.");
    } catch (err: any) {
      setError(err.message || "Couldn't prepare your download.");
    } finally {
      setDownloading(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!response.ok) {
        throw new Error((await response.json()).error || "Couldn't delete your account.");
      }
      // The row is gone but the session cookie is a signed JWT the server can't
      // revoke, so the sign-out has to happen here — otherwise the student is
      // left holding a session pointing at nothing.
      await signOut({ callbackUrl: "/" });
    } catch (err: any) {
      setDeleteError(err.message || "Couldn't delete your account.");
      setDeleting(false);
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

            {/* The two halves of what /privacy promises: get your data out, and
                get your account gone. Kept as separate cards, and deletion in a
                visually distinct one, so the irreversible action never sits a
                few pixels from a routine one. */}
            <section className="mt-6 rounded-xl bg-surface-lowest p-6 shadow-card">
              <h2 className="text-lg font-semibold text-on-surface">Your data</h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                Download everything this account holds — your profile, your interests and
                goals, your saved intake answers, and every pathway you&apos;ve saved — as a
                JSON file.
              </p>

              <button
                type="button"
                onClick={downloadData}
                disabled={downloading}
                className="mt-5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                {downloading ? "Preparing…" : "Download your data"}
              </button>
            </section>

            <section className="mt-6 rounded-xl border border-error/30 bg-surface-lowest p-6 shadow-card">
              <h2 className="text-lg font-semibold text-error">Delete your account</h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                This permanently deletes your account, your saved pathways, and everything
                else on this page. It happens immediately and{" "}
                <strong className="font-semibold text-on-surface">cannot be undone</strong> —
                there is no restore and no grace period. Download your data first if you
                want to keep it.
              </p>

              {!confirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="mt-5 rounded-full border border-error/40 px-4 py-2 text-sm font-semibold text-error transition-colors hover:bg-error-container/40"
                >
                  Delete account
                </button>
              ) : (
                <div className="mt-5 border-t border-outline-variant pt-5">
                  <label className="block text-sm font-medium text-on-surface-variant">
                    Confirm with your password
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      autoComplete="current-password"
                      className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-error/40"
                    />
                  </label>

                  {deleteError && (
                    <p className="mt-3 rounded-lg border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
                      {deleteError}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={deleteAccount}
                      disabled={deleting || !deletePassword}
                      className="rounded-full bg-error px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-error/90 disabled:opacity-40"
                    >
                      {deleting ? "Deleting…" : "Permanently delete my account"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingDelete(false);
                        setDeletePassword("");
                        setDeleteError(null);
                      }}
                      disabled={deleting}
                      className="text-sm text-outline transition-colors hover:text-primary disabled:opacity-40"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
