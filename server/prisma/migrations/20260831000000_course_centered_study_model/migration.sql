-- Course-centered study model.
--
-- Study Group becomes Study Circle, sessions are generalised so they no longer
-- require a Circle, and Study Requests + Course Questions are introduced.
--
-- Every rename below is an ALTER ... RENAME rather than a drop/create, so all
-- existing circles, memberships, sessions and RSVPs survive intact. Only the
-- chat and notification tables are dropped, and only because chat leaves the
-- product entirely.

-- ---------------------------------------------------------------- new enums
CREATE TYPE "CircleStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "SessionStatus" AS ENUM ('PLANNED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "StudyRequestIntent" AS ENUM ('NEED_HELP', 'CAN_HELP', 'REVIEW_TOGETHER');
CREATE TYPE "StudyRequestStatus" AS ENUM ('OPEN', 'MATCHED', 'CONVERTED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "QuestionStatus" AS ENUM ('OPEN', 'SOLVED');

-- ------------------------------------------------------------ enum renames
ALTER TYPE "GroupPurpose" RENAME TO "CirclePurpose";
ALTER TYPE "GroupRole" RENAME TO "CircleRole";

-- ------------------------------------------- drop chat + notification model
-- Chat is removed from the product. Verified development-only data before
-- running this: 2 GroupMessage rows, 0 Notification rows.
DROP TABLE "Notification";
DROP TABLE "GroupMessage";
DROP TYPE "NotificationKind";

-- --------------------------------------------- StudyGroup -> StudyCircle
ALTER TABLE "StudyGroup" RENAME TO "StudyCircle";
ALTER TABLE "StudyCircle" RENAME CONSTRAINT "StudyGroup_pkey" TO "StudyCircle_pkey";
ALTER TABLE "StudyCircle" RENAME CONSTRAINT "StudyGroup_courseId_fkey" TO "StudyCircle_courseId_fkey";
ALTER TABLE "StudyCircle" RENAME CONSTRAINT "StudyGroup_creatorId_fkey" TO "StudyCircle_creatorId_fkey";
ALTER INDEX "StudyGroup_courseId_idx" RENAME TO "StudyCircle_courseId_idx";
ALTER INDEX "StudyGroup_creatorId_idx" RENAME TO "StudyCircle_creatorId_idx";

ALTER TABLE "StudyCircle" ADD COLUMN "recurringSchedule" TEXT;
ALTER TABLE "StudyCircle" ADD COLUMN "externalLink" TEXT;
ALTER TABLE "StudyCircle" ADD COLUMN "status" "CircleStatus" NOT NULL DEFAULT 'ACTIVE';
-- Added with a default so existing rows get a sensible term, then the default is
-- dropped: every Circle created from here on must state its own term.
ALTER TABLE "StudyCircle" ADD COLUMN "term" TEXT NOT NULL DEFAULT 'Fall 2026';
ALTER TABLE "StudyCircle" ALTER COLUMN "term" DROP DEFAULT;

CREATE INDEX "StudyCircle_courseId_status_idx" ON "StudyCircle"("courseId", "status");

-- ------------------------------------- StudyGroupMember -> StudyCircleMember
ALTER TABLE "StudyGroupMember" RENAME TO "StudyCircleMember";
ALTER TABLE "StudyCircleMember" RENAME COLUMN "studyGroupId" TO "circleId";
ALTER TABLE "StudyCircleMember" RENAME CONSTRAINT "StudyGroupMember_pkey" TO "StudyCircleMember_pkey";
ALTER TABLE "StudyCircleMember" RENAME CONSTRAINT "StudyGroupMember_studyGroupId_fkey" TO "StudyCircleMember_circleId_fkey";
ALTER TABLE "StudyCircleMember" RENAME CONSTRAINT "StudyGroupMember_userId_fkey" TO "StudyCircleMember_userId_fkey";
ALTER INDEX "StudyGroupMember_studyGroupId_userId_key" RENAME TO "StudyCircleMember_circleId_userId_key";
ALTER INDEX "StudyGroupMember_userId_idx" RENAME TO "StudyCircleMember_userId_idx";

-- Unread state belonged to chat.
ALTER TABLE "StudyCircleMember" DROP COLUMN "lastReadAt";

-- ------------------------------------------------ generalise StudySession
ALTER TABLE "StudySession" RENAME COLUMN "groupId" TO "circleId";
ALTER TABLE "StudySession" RENAME CONSTRAINT "StudySession_groupId_fkey" TO "StudySession_circleId_fkey";
ALTER INDEX "StudySession_groupId_idx" RENAME TO "StudySession_circleId_idx";

-- courseId becomes the one required parent. Backfilled from the Circle each
-- existing session already belongs to, so nothing is orphaned.
ALTER TABLE "StudySession" ADD COLUMN "courseId" TEXT;
UPDATE "StudySession" s
   SET "courseId" = c."courseId"
  FROM "StudyCircle" c
 WHERE s."circleId" = c."id";
ALTER TABLE "StudySession" ALTER COLUMN "courseId" SET NOT NULL;

-- A session may now exist without a Circle (request-derived sessions), so the
-- link becomes optional and losing the Circle no longer deletes the meeting.
ALTER TABLE "StudySession" ALTER COLUMN "circleId" DROP NOT NULL;
ALTER TABLE "StudySession" DROP CONSTRAINT "StudySession_circleId_fkey";
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_circleId_fkey"
  FOREIGN KEY ("circleId") REFERENCES "StudyCircle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StudySession" ADD COLUMN "studyRequestId" TEXT;
ALTER TABLE "StudySession" ADD COLUMN "agenda" TEXT;
ALTER TABLE "StudySession" ADD COLUMN "topicsCompleted" TEXT;
ALTER TABLE "StudySession" ADD COLUMN "recap" TEXT;
ALTER TABLE "StudySession" ADD COLUMN "status" "SessionStatus" NOT NULL DEFAULT 'PLANNED';

ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "StudySession_studyRequestId_key" ON "StudySession"("studyRequestId");
CREATE INDEX "StudySession_courseId_startsAt_idx" ON "StudySession"("courseId", "startsAt");
CREATE INDEX "StudySession_status_idx" ON "StudySession"("status");
CREATE INDEX "StudySession_organizerId_idx" ON "StudySession"("organizerId");

-- ------------------------------------------------------------------- User
ALTER TABLE "User" ADD COLUMN "studyProfileVisible" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX "User_studyProfileVisible_idx" ON "User"("studyProfileVisible");

-- ----------------------------------------------------------- RefreshToken
-- Rotation stamps this instead of deleting the row, so a racing tab presenting
-- the previous token inside the grace window is not signed out.
ALTER TABLE "RefreshToken" ADD COLUMN "rotatedAt" TIMESTAMP(3);
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- ----------------------------------------------------------------- Course
CREATE INDEX "Course_departmentId_idx" ON "Course"("departmentId");

-- --------------------------------------------------------- Study Requests
CREATE TABLE "StudyRequest" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "details" TEXT,
    "intent" "StudyRequestIntent" NOT NULL,
    "meetingStyle" "MeetingStyle" NOT NULL DEFAULT 'FLEXIBLE',
    "location" TEXT,
    "maxParticipants" INTEGER NOT NULL,
    "status" "StudyRequestStatus" NOT NULL DEFAULT 'OPEN',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudyRequestTimeOption" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyRequestTimeOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudyRequestParticipant" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyRequestParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudyRequestAvailability" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "timeOptionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyRequestAvailability_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StudyRequest_courseId_status_idx" ON "StudyRequest"("courseId", "status");
CREATE INDEX "StudyRequest_courseId_createdAt_idx" ON "StudyRequest"("courseId", "createdAt");
CREATE INDEX "StudyRequest_creatorId_idx" ON "StudyRequest"("creatorId");
CREATE INDEX "StudyRequest_status_expiresAt_idx" ON "StudyRequest"("status", "expiresAt");
CREATE INDEX "StudyRequestTimeOption_requestId_idx" ON "StudyRequestTimeOption"("requestId");
CREATE INDEX "StudyRequestTimeOption_startsAt_idx" ON "StudyRequestTimeOption"("startsAt");
CREATE INDEX "StudyRequestParticipant_userId_idx" ON "StudyRequestParticipant"("userId");
CREATE UNIQUE INDEX "StudyRequestParticipant_requestId_userId_key" ON "StudyRequestParticipant"("requestId", "userId");
CREATE INDEX "StudyRequestAvailability_timeOptionId_idx" ON "StudyRequestAvailability"("timeOptionId");
CREATE UNIQUE INDEX "StudyRequestAvailability_participantId_timeOptionId_key" ON "StudyRequestAvailability"("participantId", "timeOptionId");

ALTER TABLE "StudyRequest" ADD CONSTRAINT "StudyRequest_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyRequest" ADD CONSTRAINT "StudyRequest_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyRequestTimeOption" ADD CONSTRAINT "StudyRequestTimeOption_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "StudyRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyRequestParticipant" ADD CONSTRAINT "StudyRequestParticipant_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "StudyRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyRequestParticipant" ADD CONSTRAINT "StudyRequestParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyRequestAvailability" ADD CONSTRAINT "StudyRequestAvailability_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "StudyRequestParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyRequestAvailability" ADD CONSTRAINT "StudyRequestAvailability_timeOptionId_fkey" FOREIGN KEY ("timeOptionId") REFERENCES "StudyRequestTimeOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_studyRequestId_fkey" FOREIGN KEY ("studyRequestId") REFERENCES "StudyRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- -------------------------------------------------------- Course Questions
CREATE TABLE "CourseQuestion" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "QuestionStatus" NOT NULL DEFAULT 'OPEN',
    "acceptedAnswerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourseAnswer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseAnswer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseQuestion_acceptedAnswerId_key" ON "CourseQuestion"("acceptedAnswerId");
CREATE INDEX "CourseQuestion_courseId_status_idx" ON "CourseQuestion"("courseId", "status");
CREATE INDEX "CourseQuestion_courseId_createdAt_idx" ON "CourseQuestion"("courseId", "createdAt");
CREATE INDEX "CourseQuestion_authorId_idx" ON "CourseQuestion"("authorId");
CREATE INDEX "CourseAnswer_questionId_idx" ON "CourseAnswer"("questionId");
CREATE INDEX "CourseAnswer_authorId_idx" ON "CourseAnswer"("authorId");

ALTER TABLE "CourseQuestion" ADD CONSTRAINT "CourseQuestion_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseQuestion" ADD CONSTRAINT "CourseQuestion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseQuestion" ADD CONSTRAINT "CourseQuestion_acceptedAnswerId_fkey" FOREIGN KEY ("acceptedAnswerId") REFERENCES "CourseAnswer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CourseAnswer" ADD CONSTRAINT "CourseAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "CourseQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseAnswer" ADD CONSTRAINT "CourseAnswer_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
