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

async function main() {
  for (const course of courses) {
    await prisma.course.upsert({
      where: {
        code: course.code,
      },
      update: course,
      create: course,
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
