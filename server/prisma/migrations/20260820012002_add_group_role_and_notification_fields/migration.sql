/*
  Warnings:

  - You are about to drop the column `text` on the `Notification` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `GroupMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `message` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('OWNER', 'MEMBER');

-- AlterTable
ALTER TABLE "GroupMessage" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "text",
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StudyGroupMember" ADD COLUMN     "role" "GroupRole" NOT NULL DEFAULT 'MEMBER';

-- Backfill: every existing membership held by the group's creator becomes OWNER.
-- Without this, groups created before this migration would have no owner at all,
-- since the DEFAULT above makes every pre-existing row a MEMBER.
UPDATE "StudyGroupMember" m
   SET "role" = 'OWNER'
  FROM "StudyGroup" g
 WHERE m."studyGroupId" = g."id"
   AND m."userId" = g."creatorId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT;
