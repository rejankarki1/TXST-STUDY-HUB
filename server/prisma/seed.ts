import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const courses = [
  {
    code: "CS 1428",
    title: "Foundations of Computer Science I",
    description:
      "Introduction to programming, problem solving, and core computer science concepts.",
  },
  {
    code: "CS 2308",
    title: "Foundations of Computer Science II",
    description:
      "Continues programming foundations with data structures, algorithms, and software design practice.",
  },
  {
    code: "MATH 2471",
    title: "Calculus I",
    description:
      "Limits, derivatives, applications of differentiation, and an introduction to integration.",
  },
  {
    code: "MATH 2472",
    title: "Calculus II",
    description:
      "Integration techniques, sequences, series, and applications of integral calculus.",
  },
  {
    code: "MATH 2358",
    title: "Discrete Mathematics",
    description:
      "Logic, proof techniques, sets, relations, functions, counting, and graph fundamentals.",
  },
  {
    code: "ENG 1310",
    title: "College Writing I",
    description:
      "Foundational college writing course focused on rhetoric, revision, and academic essays.",
  },
  {
    code: "POSI 2310",
    title: "Principles of American Government",
    description:
      "Survey of American political institutions, constitutional principles, and civic participation.",
  },
];

const departments = [
  {
    code: "CS",
    name: "Computer Science",
  },
  {
    code: "MATH",
    name: "Mathematics",
  },
  {
    code: "ENG",
    name: "English",
  },
  {
    code: "POSI",
    name: "Political Science",
  },
];

function getDepartmentCode(courseCode: string) {
  return courseCode.split(" ")[0];
}

async function main() {
  for (const department of departments) {
    await prisma.department.upsert({
      where: {
        code: department.code,
      },
      update: department,
      create: department,
    });
  }

  for (const course of courses) {
    const department = await prisma.department.findUniqueOrThrow({
      where: {
        code: getDepartmentCode(course.code),
      },
      select: {
        id: true,
      },
    });

    await prisma.course.upsert({
      where: {
        code: course.code,
      },
      update: {
        ...course,
        departmentId: department.id,
      },
      create: {
        ...course,
        departmentId: department.id,
      },
    });
  }

  console.log(`Seeded ${courses.length} courses.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
