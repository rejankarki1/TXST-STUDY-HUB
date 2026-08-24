-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_postId_fkey";

-- DropForeignKey
ALTER TABLE "CourseExperience" DROP CONSTRAINT "CourseExperience_authorId_fkey";

-- DropForeignKey
ALTER TABLE "CourseExperience" DROP CONSTRAINT "CourseExperience_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_postId_fkey";

-- DropTable
DROP TABLE "Answer";

-- DropTable
DROP TABLE "CourseExperience";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "Resource";

-- DropEnum
DROP TYPE "ExperienceDifficulty";

-- DropEnum
DROP TYPE "PostStatus";

-- DropEnum
DROP TYPE "PostType";

-- DropEnum
DROP TYPE "ResourceType";

