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

/**
 * Official Texas State University course subjects, 2026-2027 catalog.
 * Source: https://mycatalog.txstate.edu/courses/
 *
 * This list is authoritative: POST /courses requires a course's department to
 * already exist and its code to equal the course prefix, so a subject missing
 * here is a subject students cannot add courses in. Codes are stored the way
 * normalizeDepartmentCode() in courses.schema.ts will produce them, which is
 * why the two space-separated catalog codes lose their space.
 */
const departments = [
  { code: "ACC", name: "Accounting" },
  { code: "ADED", name: "Adult Education" },
  { code: "AS", name: "Aerospace Studies" },  // catalog prints "A S"
  { code: "AAS", name: "African American Studies" },
  { code: "AG", name: "Agriculture" },
  { code: "ASL", name: "American Sign Language" },
  { code: "ANLY", name: "Analytics" },
  { code: "ANTH", name: "Anthropology" },
  { code: "ARAB", name: "Arabic" },
  { code: "ART", name: "Art" },
  { code: "ARTF", name: "Art Foundation" },
  { code: "ARTH", name: "Art History" },
  { code: "ARTS", name: "Art Studio" },
  { code: "ARTT", name: "Art Theory and Practice" },
  { code: "AT", name: "Athletic Training" },
  { code: "BILG", name: "Bilingual Education" },
  { code: "BIO", name: "Biology" },
  { code: "BA", name: "Business Administration" },  // catalog prints "B A"
  { code: "BLAW", name: "Business Law" },
  { code: "CTE", name: "Career and Technical Education" },
  { code: "CHEM", name: "Chemistry" },
  { code: "CHI", name: "Chinese" },
  { code: "CE", name: "Civil Engineering" },
  { code: "ARTC", name: "Communication Design" },
  { code: "CDIS", name: "Communication Disorders" },
  { code: "COMM", name: "Communication Studies" },
  { code: "CS", name: "Computer Science" },
  { code: "CIM", name: "Concrete Industry Management" },
  { code: "CSM", name: "Construction Science and Management" },
  { code: "CA", name: "Consumer Affairs" },
  { code: "COUN", name: "Counseling" },
  { code: "CJ", name: "Criminal Justice" },
  { code: "CI", name: "Curriculum and Instruction" },
  { code: "DAN", name: "Dance" },
  { code: "DE", name: "Developmental Education" },
  { code: "DVST", name: "Diversity Studies" },
  { code: "ECE", name: "Early Childhood Education" },
  { code: "ECO", name: "Economics" },
  { code: "ED", name: "Education" },
  { code: "EDCL", name: "Educational Leadership" },
  { code: "EDP", name: "Educational Psychology" },
  { code: "EDTC", name: "Educational Technology" },
  { code: "EDST", name: "Education Student Teaching" },
  { code: "EE", name: "Electrical Engineering" },
  { code: "ENGR", name: "Engineering" },
  { code: "EMGT", name: "Engineering Management" },
  { code: "ENG", name: "English" },
  { code: "ELAR", name: "English, Language Arts & Reading" },
  { code: "ESS", name: "Exercise and Sports Science" },
  { code: "FCS", name: "Family and Consumer Sciences" },
  { code: "FM", name: "Fashion Merchandising" },
  { code: "FIN", name: "Finance" },
  { code: "FR", name: "French" },
  { code: "GS", name: "General Science" },
  { code: "GEO", name: "Geography and Environmental Studies" },
  { code: "GEOL", name: "Geology" },
  { code: "GER", name: "German" },
  { code: "HA", name: "Healthcare Administration" },
  { code: "HHP", name: "Health & Human Performance" },
  { code: "HI", name: "Health Informatics" },
  { code: "HIM", name: "Health Information Management" },
  { code: "HP", name: "Health Professions" },
  { code: "HS", name: "Health Sciences" },
  { code: "HSPN", name: "Hispanic Literature and Culture in English" },
  { code: "HIST", name: "History" },
  { code: "HON", name: "Honors" },
  { code: "HDFS", name: "Human Development & Family Sciences" },
  { code: "IE", name: "Industrial Engineering" },
  { code: "ISAN", name: "Information Systems" },
  { code: "INTS", name: "Integrated Studies" },
  { code: "ID", name: "Interior Design" },
  { code: "IS", name: "International Studies" },
  { code: "ITAL", name: "Italian" },
  { code: "JAPA", name: "Japanese" },
  { code: "LAT", name: "Latin" },
  { code: "LATS", name: "Latina/o Studies" },
  { code: "LS", name: "Legal Studies" },
  { code: "LING", name: "Linguistics" },
  { code: "LTCA", name: "Long Term Care Administration" },
  { code: "MGT", name: "Management" },
  { code: "MFGE", name: "Manufacturing Engineering" },
  { code: "MKT", name: "Marketing" },
  { code: "MC", name: "Mass Communication" },
  { code: "MSEC", name: "Materials Science, Engineering, and Commercialization" },
  { code: "MATH", name: "Mathematics" },
  { code: "MMIE", name: "Mechanical and Manufacturing Engineering" },
  { code: "ME", name: "Mechanical Engineering" },
  { code: "MLS", name: "Medical Laboratory Science" },
  { code: "MS", name: "Military Science" },
  { code: "MU", name: "Music" },
  { code: "MUSE", name: "Music Ensemble" },
  { code: "MUSP", name: "Music Performance" },
  { code: "NHT", name: "Nature and Heritage Tourism" },
  { code: "NURS", name: "Nursing" },
  { code: "NUTR", name: "Nutrition and Foods" },
  { code: "OCED", name: "Occupational Education" },
  { code: "PHIL", name: "Philosophy" },
  { code: "PFW", name: "Physical Fitness and Wellness" },
  { code: "PT", name: "Physical Therapy" },
  { code: "PHYS", name: "Physics" },
  { code: "POSI", name: "Political Science" },
  { code: "PS", name: "Political Science" },
  { code: "POR", name: "Portuguese" },
  { code: "PSY", name: "Psychology" },
  { code: "PA", name: "Public Administration" },
  { code: "PH", name: "Public Health" },
  { code: "QFE", name: "Quantitative Finance & Economics" },
  { code: "RTT", name: "Radiation Therapy" },
  { code: "RDG", name: "Reading" },
  { code: "REC", name: "Recreation" },
  { code: "REL", name: "Religion" },
  { code: "RES", name: "Research & Creative Expression" },
  { code: "RC", name: "Respiratory Care" },
  { code: "RUSS", name: "Russian" },
  { code: "SPSY", name: "School Psychology" },
  { code: "SOWK", name: "Social Work" },
  { code: "SOCI", name: "Sociology" },
  { code: "SPAN", name: "Spanish" },
  { code: "SPED", name: "Special Education" },
  { code: "SPTM", name: "Sport Management" },
  { code: "STAT", name: "Statistics" },
  { code: "SAHE", name: "Student Affairs in Higher Education" },
  { code: "SCM", name: "Supply Chain Management" },
  { code: "SUST", name: "Sustainability Studies" },
  { code: "TECH", name: "Technology" },
  { code: "TH", name: "Theatre" },
  { code: "US", name: "University Seminar" },
  { code: "WS", name: "Women's Studies" },
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

  /* The catalog list is authoritative, so anything not on it is removed --
     but only when it owns no courses. Course.departmentId is onDelete: SetNull,
     so deleting a populated department would silently orphan real courses
     instead of failing; the guard makes that impossible. */
  const officialCodes = departments.map((department) => department.code);
  const stale = await prisma.department.findMany({
    where: {
      code: {
        notIn: officialCodes,
      },
    },
    select: {
      id: true,
      code: true,
      _count: {
        select: {
          courses: true,
        },
      },
    },
  });

  const removable = stale.filter((department) => department._count.courses === 0);
  const keptWithCourses = stale.filter((department) => department._count.courses > 0);

  if (removable.length > 0) {
    await prisma.department.deleteMany({
      where: {
        id: {
          in: removable.map((department) => department.id),
        },
      },
    });
    console.log(
      `Pruned ${removable.length} non-catalog departments: ${removable
        .map((department) => department.code)
        .join(", ")}`,
    );
  }

  for (const department of keptWithCourses) {
    console.warn(
      `WARNING: "${department.code}" is not in the catalog list but owns ${department._count.courses} course(s); left in place.`,
    );
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

  console.log(
    `Seeded ${departments.length} departments and ${courses.length} courses.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
