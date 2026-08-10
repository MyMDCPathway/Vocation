-- Reconciliation migration, not a fresh change.
--
-- postalCode and countryCode were added to User via `prisma db push` on
-- 2026-08-05 (see HANDOFF.md §15: "The two new User columns were applied
-- with prisma db push, so there's no migration file recording
-- postalCode/countryCode"). This file records that change for real, so the
-- migration history matches schema.prisma and the next `prisma migrate
-- deploy` doesn't try to add columns that already exist.
--
-- Generated via a schema-to-schema diff (not hand-written) against a
-- reconstruction of the init migration's actual User columns, then applied
-- to the migration history with `prisma migrate resolve --applied` rather
-- than executed — the columns are already live in production, and running
-- this SQL for real would fail with "column already exists".

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "countryCode" TEXT,
ADD COLUMN     "postalCode" TEXT;
