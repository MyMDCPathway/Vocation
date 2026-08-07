-- CreateTable
CREATE TABLE "SavedPathway" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "career" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "edits" JSONB,
    "notes" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedPathway_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedPathway_userId_archived_idx" ON "SavedPathway"("userId", "archived");

-- AddForeignKey
ALTER TABLE "SavedPathway" ADD CONSTRAINT "SavedPathway_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
