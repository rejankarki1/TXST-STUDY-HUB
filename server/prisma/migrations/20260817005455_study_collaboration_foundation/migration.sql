-- CreateEnum
CREATE TYPE "GroupPurpose" AS ENUM ('EXAM_PREP', 'HOMEWORK', 'WEEKLY_STUDYING', 'PROJECT_WORK', 'GENERAL_STUDY');

-- CreateEnum
CREATE TYPE "MeetingStyle" AS ENUM ('IN_PERSON', 'ONLINE', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('IN_PERSON', 'ONLINE');

-- CreateEnum
CREATE TYPE "SessionRsvpStatus" AS ENUM ('GOING', 'MAYBE', 'CANT');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('SESSION', 'MESSAGE', 'REMINDER', 'MEMBER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "gradYear" INTEGER,
ADD COLUMN "major" TEXT,
ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- Rename the persistent group identity field before dropping scheduled-event fields.
ALTER TABLE "StudyGroup" RENAME COLUMN "title" TO "name";

-- AlterTable
ALTER TABLE "StudyGroup" ADD COLUMN "meetingStyle" "MeetingStyle" NOT NULL DEFAULT 'FLEXIBLE',
ADD COLUMN "purpose" "GroupPurpose" NOT NULL DEFAULT 'GENERAL_STUDY';

-- Backfill persistent-group meeting style from the old scheduled-group mode.
UPDATE "StudyGroup"
SET "meetingStyle" = CASE
  WHEN "mode" = 'ONLINE' THEN 'ONLINE'::"MeetingStyle"
  WHEN "mode" = 'IN_PERSON' THEN 'IN_PERSON'::"MeetingStyle"
  ELSE 'FLEXIBLE'::"MeetingStyle"
END;

-- AlterTable
ALTER TABLE "StudyGroupMember" ADD COLUMN "lastReadAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserCourse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudySession" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "mode" "SessionMode" NOT NULL,
    "location" TEXT NOT NULL,
    "locationDetail" TEXT,
    "meetingLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

-- Preserve existing scheduled StudyGroup data as initial sessions before
-- removing scheduled-event columns from the persistent StudyGroup table.
INSERT INTO "StudySession" (
  "id",
  "groupId",
  "organizerId",
  "title",
  "description",
  "startsAt",
  "endsAt",
  "mode",
  "location",
  "meetingLink",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::TEXT,
  "id",
  "creatorId",
  "name",
  "description",
  "startDateTime",
  "startDateTime" + INTERVAL '2 hours',
  CASE
    WHEN "mode" = 'ONLINE' THEN 'ONLINE'::"SessionMode"
    ELSE 'IN_PERSON'::"SessionMode"
  END,
  CASE
    WHEN "mode" = 'ONLINE' THEN COALESCE(NULLIF("location", ''), 'Online')
    ELSE COALESCE(NULLIF("location", ''), 'TBD')
  END,
  CASE
    WHEN "mode" = 'ONLINE' THEN "onlineDetails"
    ELSE NULL
  END,
  "createdAt",
  "updatedAt"
FROM "StudyGroup";

-- CreateTable
CREATE TABLE "SessionRsvp" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SessionRsvpStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionRsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMessage" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "actorId" TEXT,
    "groupId" TEXT,
    "sessionId" TEXT,
    "text" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Drop old scheduled-event columns from persistent groups after data preservation.
ALTER TABLE "StudyGroup" DROP COLUMN "location",
DROP COLUMN "mode",
DROP COLUMN "onlineDetails",
DROP COLUMN "startDateTime",
DROP COLUMN "status";

-- Drop old study-group status/mode enums after all dependent columns are gone.
DROP TYPE "StudyGroupMode";
DROP TYPE "StudyGroupStatus";

-- CreateIndex
CREATE UNIQUE INDEX "UserCourse_userId_courseId_key" ON "UserCourse"("userId", "courseId");

-- CreateIndex
CREATE INDEX "UserCourse_userId_idx" ON "UserCourse"("userId");

-- CreateIndex
CREATE INDEX "UserCourse_courseId_idx" ON "UserCourse"("courseId");

-- CreateIndex
CREATE INDEX "StudyGroup_courseId_idx" ON "StudyGroup"("courseId");

-- CreateIndex
CREATE INDEX "StudyGroup_creatorId_idx" ON "StudyGroup"("creatorId");

-- CreateIndex
CREATE INDEX "StudyGroupMember_userId_idx" ON "StudyGroupMember"("userId");

-- CreateIndex
CREATE INDEX "StudySession_groupId_idx" ON "StudySession"("groupId");

-- CreateIndex
CREATE INDEX "StudySession_startsAt_idx" ON "StudySession"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "SessionRsvp_sessionId_userId_key" ON "SessionRsvp"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "SessionRsvp_userId_idx" ON "SessionRsvp"("userId");

-- CreateIndex
CREATE INDEX "GroupMessage_groupId_createdAt_idx" ON "GroupMessage"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "UserCourse" ADD CONSTRAINT "UserCourse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCourse" ADD CONSTRAINT "UserCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionRsvp" ADD CONSTRAINT "SessionRsvp_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionRsvp" ADD CONSTRAINT "SessionRsvp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
