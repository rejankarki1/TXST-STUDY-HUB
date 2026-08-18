import { prisma } from "../config/prisma.js";
import { PostType } from "../generated/prisma/enums.js";
import { studyGroupSelect } from "./study-groups.service.js";

const courseSelect = {
  id: true,
  code: true,
  title: true,
  description: true,
  department: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
};

const authorSelect = {
  id: true,
  name: true,
  email: true,
};

export async function getHomeOverview() {
  const [courses, questions, experiences, resources, studyGroups] =
    await Promise.all([
      prisma.course.findMany({
        orderBy: {
          code: "asc",
        },
        take: 4,
        select: courseSelect,
      }),
      prisma.post.findMany({
        where: {
          type: PostType.QUESTION,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          title: true,
          body: true,
          status: true,
          acceptedAnswerId: true,
          courseId: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: authorSelect,
          },
          course: {
            select: courseSelect,
          },
          _count: {
            select: {
              answers: true,
            },
          },
        },
      }),
      prisma.courseExperience.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          title: true,
          body: true,
          difficulty: true,
          professorName: true,
          term: true,
          courseId: true,
          authorId: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: authorSelect,
          },
          course: {
            select: courseSelect,
          },
        },
      }),
      prisma.resource.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          url: true,
          resourceType: true,
          createdAt: true,
          updatedAt: true,
          post: {
            select: {
              id: true,
              title: true,
              body: true,
              courseId: true,
              authorId: true,
              author: {
                select: authorSelect,
              },
              course: {
                select: courseSelect,
              },
            },
          },
        },
      }),
      prisma.studyGroup.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: studyGroupSelect,
      }),
    ]);

  return {
    courses,
    questions,
    experiences,
    resources: resources.map((resource) => ({
      id: resource.id,
      postId: resource.post.id,
      title: resource.post.title,
      description: resource.post.body,
      url: resource.url,
      resourceType: resource.resourceType,
      courseId: resource.post.courseId,
      authorId: resource.post.authorId,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      author: resource.post.author,
      course: resource.post.course,
    })),
    studyGroups,
  };
}
