-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('VIDEO', 'PRACTICE', 'DOCUMENTATION', 'GUIDE', 'TOOL', 'OFFICIAL');

-- AlterEnum
ALTER TYPE "PostType" ADD VALUE 'RESOURCE';

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "resourceType" "ResourceType" NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Resource_postId_key" ON "Resource"("postId");

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
