import type { RequestHandler } from "express";

import { prisma } from "../config/prisma.js";
import { PostType } from "../generated/prisma/enums.js";
import type { ResourceType } from "../generated/prisma/enums.js";

const resourceSelect = {
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
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      course: {
        select: {
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
        },
      },
    },
  },
};

function toResourceResponse(resource: {
  id: string;
  url: string;
  resourceType: ResourceType;
  createdAt: Date;
  updatedAt: Date;
  post: {
    id: string;
    title: string;
    body: string;
    courseId: string;
    authorId: string;
    createdAt: Date;
    updatedAt: Date;
    author: {
      id: string;
      name: string | null;
      email: string;
    };
    course?: {
      id: string;
      code: string;
      title: string;
      description: string | null;
      department: {
        id: string;
        code: string;
        name: string;
      } | null;
    };
  };
}) {
  return {
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
  };
}

export const listCourseResources: RequestHandler = async (req, res) => {
  const courseId = req.params.courseId;

  if (typeof courseId !== "string") {
    res.status(404).json({
      success: false,
      message: "Course not found",
    });
    return;
  }

  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
    select: {
      id: true,
    },
  });

  if (!course) {
    res.status(404).json({
      success: false,
      message: "Course not found",
    });
    return;
  }

  const resources = await prisma.resource.findMany({
    where: {
      post: {
        courseId,
        type: PostType.RESOURCE,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: resourceSelect,
  });

  res.json({
    success: true,
    data: {
      resources: resources.map(toResourceResponse),
    },
  });
};

export const createResource: RequestHandler = async (req, res) => {
  const courseId = req.params.courseId;

  if (typeof courseId !== "string") {
    res.status(404).json({
      success: false,
      message: "Course not found",
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
    select: {
      id: true,
    },
  });

  if (!course) {
    res.status(404).json({
      success: false,
      message: "Course not found",
    });
    return;
  }

  const { description, resourceType, title, url } = req.body as {
    title: string;
    description: string;
    url: string;
    resourceType: ResourceType;
  };

  const resource = await prisma.$transaction(async (tx) => {
    const post = await tx.post.create({
      data: {
        title,
        body: description,
        type: PostType.RESOURCE,
        courseId,
        authorId: req.user!.id,
      },
      select: {
        id: true,
      },
    });

    return tx.resource.create({
      data: {
        url,
        resourceType,
        postId: post.id,
      },
      select: resourceSelect,
    });
  });

  res.status(201).json({
    success: true,
    message: "Resource created",
    data: {
      resource: toResourceResponse(resource),
    },
  });
};

export const getResourceById: RequestHandler = async (req, res) => {
  const resourceId = req.params.resourceId;

  if (typeof resourceId !== "string") {
    res.status(404).json({
      success: false,
      message: "Resource not found",
    });
    return;
  }

  const resource = await prisma.resource.findFirst({
    where: {
      id: resourceId,
      post: {
        type: PostType.RESOURCE,
      },
    },
    select: resourceSelect,
  });

  if (!resource) {
    res.status(404).json({
      success: false,
      message: "Resource not found",
    });
    return;
  }

  res.json({
    success: true,
    data: {
      resource: toResourceResponse(resource),
    },
  });
};
