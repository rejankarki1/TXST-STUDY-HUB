import type { RequestHandler } from "express";

import { prisma } from "../config/prisma.js";

export const listDepartments: RequestHandler = async (req, res) => {
  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : "";

  const departments = await prisma.department.findMany({
    where: search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: {
      code: "asc",
    },
    select: {
      id: true,
      code: true,
      name: true,
    },
  });

  res.json({
    success: true,
    data: {
      departments,
    },
  });
};
