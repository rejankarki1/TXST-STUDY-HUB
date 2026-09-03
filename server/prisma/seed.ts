import "dotenv/config";

import crypto from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

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
    code: "CS 3358",
    title: "Data Structures and Algorithms",
    description:
      "Lists, stacks, queues, trees, hashing, graphs, and the algorithm analysis that goes with them.",
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

/* --------------------------------------------------------------- demo data */

/**
 * A stable UUID for a seed row.
 *
 * Study requests, sessions and questions have no natural unique column to upsert
 * on, so the seed derives a deterministic v5-style id from a slug instead. That
 * is what makes re-running the seed a no-op rather than a way to accumulate five
 * copies of the same demo data.
 */
function seedId(key: string) {
  const bytes = Buffer.from(
    crypto.createHash("sha1").update(`txst-study-hub:${key}`).digest().subarray(0, 16),
  );
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

/* Everything is relative to the run, so a freshly seeded database always has
   sessions in the future and a completed one in the past. */
const now = new Date();

function at(dayOffset: number, hour: number, minute = 0) {
  const date = new Date(now);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

const demoPassword = process.env.DEMO_PASSWORD ?? "DemoStudy!2026";

const demoUsers = [
  {
    key: "demo",
    email: "demo.student@txstate.edu",
    name: "Demo Student",
    major: "Computer Science",
    gradYear: now.getFullYear() + 2,
    courses: ["CS 2308", "CS 3358", "MATH 2358", "ENG 1310"],
  },
  {
    /* A second full-access login, so the primary demo account can be handed out
       without two people fighting over one session. Same courses as "demo" so
       every course view has data behind it. */
    key: "demo2",
    email: "demo2.student@txstate.edu",
    name: "Demo Student Two",
    major: "Computer Science",
    gradYear: now.getFullYear() + 2,
    courses: ["CS 2308", "CS 3358", "MATH 2358", "ENG 1310"],
  },
  {
    key: "maya",
    email: "maya.torres@txstate.edu",
    name: "Maya Torres",
    major: "Computer Science",
    gradYear: now.getFullYear() + 1,
    courses: ["CS 2308", "CS 3358", "MATH 2472"],
  },
  {
    key: "andre",
    email: "andre.willis@txstate.edu",
    name: "Andre Willis",
    major: "Mathematics",
    gradYear: now.getFullYear() + 3,
    courses: ["MATH 2358", "MATH 2471", "CS 1428"],
  },
  {
    key: "priya",
    email: "priya.nair@txstate.edu",
    name: "Priya Nair",
    major: "Computer Science",
    gradYear: now.getFullYear() + 2,
    courses: ["CS 3358", "CS 2308", "MATH 2472"],
  },
  {
    key: "jordan",
    email: "jordan.reyes@txstate.edu",
    name: "Jordan Reyes",
    major: "English",
    gradYear: now.getFullYear() + 1,
    courses: ["ENG 1310", "POSI 2310", "CS 1428"],
  },
  {
    key: "sam",
    email: "sam.okafor@txstate.edu",
    name: "Sam Okafor",
    major: "Political Science",
    gradYear: now.getFullYear() + 4,
    /* Opted out of discovery, so the People tab has a real negative case. */
    courses: ["POSI 2310", "ENG 1310"],
    studyProfileVisible: false,
  },
];

type SeededUser = { id: string; email: string };

async function seedUsers(): Promise<Record<string, SeededUser>> {
  const passwordHash = await bcrypt.hash(demoPassword, 12);
  const byKey: Record<string, SeededUser> = {};

  for (const user of demoUsers) {
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        major: user.major,
        gradYear: user.gradYear,
        onboardingCompleted: true,
        studyProfileVisible: user.studyProfileVisible ?? true,
      },
      create: {
        id: seedId(`user:${user.key}`),
        email: user.email,
        name: user.name,
        passwordHash,
        major: user.major,
        gradYear: user.gradYear,
        onboardingCompleted: true,
        studyProfileVisible: user.studyProfileVisible ?? true,
      },
      select: { id: true, email: true },
    });

    byKey[user.key] = record;

    for (const code of user.courses) {
      const course = await prisma.course.findUnique({ where: { code }, select: { id: true } });
      if (!course) continue;

      await prisma.userCourse.upsert({
        where: { userId_courseId: { userId: record.id, courseId: course.id } },
        update: {},
        create: { userId: record.id, courseId: course.id },
      });
    }
  }

  return byKey;
}

async function courseIdByCode(code: string) {
  const course = await prisma.course.findUniqueOrThrow({
    where: { code },
    select: { id: true },
  });

  return course.id;
}

type RequestSeed = {
  key: string;
  courseCode: string;
  creator: string;
  topic: string;
  details: string;
  intent: "NEED_HELP" | "CAN_HELP" | "REVIEW_TOGETHER";
  meetingStyle: "IN_PERSON" | "ONLINE" | "FLEXIBLE";
  location?: string;
  maxParticipants: number;
  times: { startsAt: Date; endsAt: Date }[];
  joiners?: { user: string; timeIndexes: number[] }[];
};

const requestSeeds: RequestSeed[] = [
  {
    key: "req-linked-lists",
    courseCode: "CS 3358",
    creator: "maya",
    topic: "Linked lists and pointer diagrams before Exam 1",
    details:
      "I can follow the code but I lose the plot drawing what the pointers actually do. Looking for someone to work through the textbook problems with.",
    intent: "NEED_HELP",
    meetingStyle: "IN_PERSON",
    location: "Alkek Library, 4th floor",
    maxParticipants: 4,
    times: [
      { startsAt: at(2, 17), endsAt: at(2, 19) },
      { startsAt: at(3, 18), endsAt: at(3, 20) },
    ],
    joiners: [
      { user: "priya", timeIndexes: [0, 1] },
      { user: "demo", timeIndexes: [1] },
    ],
  },
  {
    key: "req-big-o",
    courseCode: "CS 3358",
    creator: "priya",
    topic: "Happy to walk anyone through Big-O analysis",
    details:
      "I tutored this last semester. If the recurrence relations are not clicking, bring your homework and we'll go through them.",
    intent: "CAN_HELP",
    meetingStyle: "ONLINE",
    maxParticipants: 6,
    times: [
      { startsAt: at(1, 20), endsAt: at(1, 21, 30) },
      { startsAt: at(4, 20), endsAt: at(4, 21, 30) },
    ],
    joiners: [{ user: "maya", timeIndexes: [0] }],
  },
  {
    key: "req-proofs",
    courseCode: "MATH 2358",
    creator: "andre",
    topic: "Induction proofs review session",
    details: "Working through the practice set together. Everyone explains one problem.",
    intent: "REVIEW_TOGETHER",
    meetingStyle: "IN_PERSON",
    location: "Derrick Hall 232",
    maxParticipants: 5,
    times: [
      { startsAt: at(3, 15), endsAt: at(3, 17) },
      { startsAt: at(5, 15), endsAt: at(5, 17) },
      { startsAt: at(6, 13), endsAt: at(6, 15) },
    ],
    joiners: [{ user: "demo", timeIndexes: [0, 2] }],
  },
  {
    key: "req-recursion",
    courseCode: "CS 2308",
    creator: "demo",
    topic: "Recursion practice — base cases keep tripping me up",
    details: "Chapter 6 exercises. Would rather work through them with someone than stare at them.",
    intent: "NEED_HELP",
    meetingStyle: "FLEXIBLE",
    maxParticipants: 3,
    times: [{ startsAt: at(2, 19), endsAt: at(2, 21) }],
  },
  {
    key: "req-essay",
    courseCode: "ENG 1310",
    creator: "jordan",
    topic: "Peer review for the rhetorical analysis essay",
    details: "Swap drafts and mark each other up before the Friday deadline.",
    intent: "REVIEW_TOGETHER",
    meetingStyle: "ONLINE",
    maxParticipants: 4,
    times: [
      { startsAt: at(1, 16), endsAt: at(1, 17, 30) },
      { startsAt: at(2, 16), endsAt: at(2, 17, 30) },
    ],
  },
];

async function seedStudyRequests(users: Record<string, SeededUser>) {
  for (const seed of requestSeeds) {
    const courseId = await courseIdByCode(seed.courseCode);
    const creator = users[seed.creator]!;
    const id = seedId(seed.key);

    await prisma.studyRequest.upsert({
      where: { id },
      update: {
        topic: seed.topic,
        details: seed.details,
        intent: seed.intent,
        meetingStyle: seed.meetingStyle,
        location: seed.location ?? null,
        maxParticipants: seed.maxParticipants,
      },
      create: {
        id,
        courseId,
        creatorId: creator.id,
        topic: seed.topic,
        details: seed.details,
        intent: seed.intent,
        meetingStyle: seed.meetingStyle,
        location: seed.location,
        maxParticipants: seed.maxParticipants,
      },
    });

    /* Time options are rewritten every run so seeded demo data never drifts into
       the past. Their ids are derived, so the availability rows below still
       line up. */
    for (const [index, time] of seed.times.entries()) {
      const optionId = seedId(`${seed.key}:time:${index}`);

      await prisma.studyRequestTimeOption.upsert({
        where: { id: optionId },
        update: { startsAt: time.startsAt, endsAt: time.endsAt },
        create: { id: optionId, requestId: id, startsAt: time.startsAt, endsAt: time.endsAt },
      });
    }

    const participants: { user: string; timeIndexes: number[] }[] = [
      { user: seed.creator, timeIndexes: seed.times.map((_, index) => index) },
      ...(seed.joiners ?? []),
    ];

    for (const entry of participants) {
      const user = users[entry.user]!;
      const participantId = seedId(`${seed.key}:participant:${entry.user}`);

      await prisma.studyRequestParticipant.upsert({
        where: { requestId_userId: { requestId: id, userId: user.id } },
        update: {},
        create: { id: participantId, requestId: id, userId: user.id },
      });

      for (const timeIndex of entry.timeIndexes) {
        const timeOptionId = seedId(`${seed.key}:time:${timeIndex}`);

        await prisma.studyRequestAvailability.upsert({
          where: { participantId_timeOptionId: { participantId, timeOptionId } },
          update: {},
          create: { participantId, timeOptionId },
        });
      }
    }
  }
}

const circleSeeds = [
  {
    key: "circle-3358",
    courseCode: "CS 3358",
    owner: "priya",
    name: "CS 3358 Tuesday Problem Set Crew",
    description:
      "We meet every Tuesday to work the problem set together before it is due. Everyone attempts it first, then we compare approaches.",
    purpose: "WEEKLY_STUDYING" as const,
    meetingStyle: "IN_PERSON" as const,
    maxMembers: 6,
    recurringSchedule: "Tuesdays 6:00 PM, Alkek 4th floor",
    members: ["maya", "demo"],
  },
  {
    key: "circle-2358",
    courseCode: "MATH 2358",
    owner: "andre",
    name: "Discrete Math Proof Workshop",
    description:
      "A standing group for working proofs on the whiteboard. We rotate who presents so everyone has to explain at least one.",
    purpose: "EXAM_PREP" as const,
    meetingStyle: "IN_PERSON" as const,
    maxMembers: 5,
    recurringSchedule: "Sundays 3:00 PM, Derrick 232",
    members: ["demo"],
  },
  {
    key: "circle-1310",
    courseCode: "ENG 1310",
    owner: "jordan",
    name: "ENG 1310 Draft Swap",
    description:
      "Last term's writing group. Archived now that the course is over, kept so the sessions stay on everyone's record.",
    purpose: "PROJECT_WORK" as const,
    meetingStyle: "ONLINE" as const,
    maxMembers: 4,
    term: "Spring 2026",
    status: "ARCHIVED" as const,
    members: ["sam"],
  },
];

const currentTerm = `${now.getMonth() >= 7 ? "Fall" : "Spring"} ${now.getFullYear()}`;

async function seedCircles(users: Record<string, SeededUser>) {
  for (const seed of circleSeeds) {
    const courseId = await courseIdByCode(seed.courseCode);
    const owner = users[seed.owner]!;
    const id = seedId(seed.key);

    await prisma.studyCircle.upsert({
      where: { id },
      update: {
        name: seed.name,
        description: seed.description,
        purpose: seed.purpose,
        meetingStyle: seed.meetingStyle,
        maxMembers: seed.maxMembers,
        recurringSchedule: seed.recurringSchedule ?? null,
        term: seed.term ?? currentTerm,
        status: seed.status ?? "ACTIVE",
      },
      create: {
        id,
        courseId,
        creatorId: owner.id,
        name: seed.name,
        description: seed.description,
        purpose: seed.purpose,
        meetingStyle: seed.meetingStyle,
        maxMembers: seed.maxMembers,
        recurringSchedule: seed.recurringSchedule,
        term: seed.term ?? currentTerm,
        status: seed.status ?? "ACTIVE",
      },
    });

    await prisma.studyCircleMember.upsert({
      where: { circleId_userId: { circleId: id, userId: owner.id } },
      update: { role: "OWNER" },
      create: { circleId: id, userId: owner.id, role: "OWNER" },
    });

    for (const memberKey of seed.members) {
      const member = users[memberKey]!;

      await prisma.studyCircleMember.upsert({
        where: { circleId_userId: { circleId: id, userId: member.id } },
        update: {},
        create: { circleId: id, userId: member.id, role: "MEMBER" },
      });
    }
  }
}

const sessionSeeds = [
  {
    key: "session-3358-weekly",
    circleKey: "circle-3358",
    courseCode: "CS 3358",
    organizer: "priya",
    title: "Problem Set 4 — trees and traversals",
    description: "Working through the tree traversal problems together.",
    agenda: "1. Compare attempts at Q1-Q3\n2. Whiteboard the traversal orders\n3. Start Q4 together",
    startsAt: at(2, 18),
    endsAt: at(2, 20),
    mode: "IN_PERSON" as const,
    location: "Alkek Library",
    locationDetail: "4th floor group room B",
    status: "PLANNED" as const,
    rsvps: [
      { user: "priya", status: "GOING" as const },
      { user: "maya", status: "GOING" as const },
      { user: "demo", status: "MAYBE" as const },
    ],
  },
  {
    key: "session-2358-review",
    circleKey: "circle-2358",
    courseCode: "MATH 2358",
    organizer: "andre",
    title: "Exam 2 proof review",
    description: "Every proof technique from chapters 4 and 5, one problem each.",
    startsAt: at(5, 15),
    endsAt: at(5, 17),
    mode: "IN_PERSON" as const,
    location: "Derrick Hall",
    locationDetail: "Room 232",
    status: "PLANNED" as const,
    rsvps: [
      { user: "andre", status: "GOING" as const },
      { user: "demo", status: "GOING" as const },
    ],
  },
  {
    key: "session-3358-past",
    circleKey: "circle-3358",
    courseCode: "CS 3358",
    organizer: "priya",
    title: "Problem Set 3 — hashing",
    description: "Hash tables, collision handling, and the load factor questions.",
    startsAt: at(-5, 18),
    endsAt: at(-5, 20),
    mode: "IN_PERSON" as const,
    location: "Alkek Library",
    locationDetail: "4th floor group room B",
    status: "COMPLETED" as const,
    topicsCompleted: "Separate chaining, open addressing, load factor tradeoffs",
    recap:
      "Got through all of Q1-Q5. Open addressing with deletion is still the shaky part for most of us.",
    rsvps: [
      { user: "priya", status: "GOING" as const },
      { user: "maya", status: "GOING" as const },
      { user: "demo", status: "GOING" as const },
    ],
  },
];

async function seedSessions(users: Record<string, SeededUser>) {
  for (const seed of sessionSeeds) {
    const courseId = await courseIdByCode(seed.courseCode);
    const organizer = users[seed.organizer]!;
    const id = seedId(seed.key);

    await prisma.studySession.upsert({
      where: { id },
      update: {
        title: seed.title,
        description: seed.description,
        agenda: seed.agenda ?? null,
        startsAt: seed.startsAt,
        endsAt: seed.endsAt,
        mode: seed.mode,
        location: seed.location,
        locationDetail: seed.locationDetail ?? null,
        status: seed.status,
        topicsCompleted: seed.topicsCompleted ?? null,
        recap: seed.recap ?? null,
      },
      create: {
        id,
        courseId,
        circleId: seedId(seed.circleKey),
        organizerId: organizer.id,
        title: seed.title,
        description: seed.description,
        agenda: seed.agenda,
        startsAt: seed.startsAt,
        endsAt: seed.endsAt,
        mode: seed.mode,
        location: seed.location,
        locationDetail: seed.locationDetail,
        status: seed.status,
        topicsCompleted: seed.topicsCompleted,
        recap: seed.recap,
      },
    });

    for (const rsvp of seed.rsvps) {
      const user = users[rsvp.user]!;

      await prisma.sessionRsvp.upsert({
        where: { sessionId_userId: { sessionId: id, userId: user.id } },
        update: { status: rsvp.status },
        create: { sessionId: id, userId: user.id, status: rsvp.status },
      });
    }
  }
}

const questionSeeds = [
  {
    key: "q-bst-delete",
    courseCode: "CS 3358",
    author: "maya",
    title: "Why does deleting a node with two children use the in-order successor?",
    body:
      "I understand the leaf and one-child cases. For two children the textbook swaps in the in-order successor, but I do not see why the predecessor would not work equally well.",
    answers: [
      {
        key: "a1",
        author: "priya",
        body:
          "Either works — they are symmetric. The successor is the smallest value in the right subtree, the predecessor is the largest in the left. Both preserve the BST ordering because both sit immediately next to the deleted value in sorted order. Textbooks pick one so the algorithm is deterministic; some implementations alternate to keep the tree balanced.",
        accepted: true,
      },
      {
        key: "a2",
        author: "demo",
        body: "Adding to that — if you always take the successor, repeated deletions can skew the tree left over time. That is one argument for alternating.",
      },
    ],
  },
  {
    key: "q-recursion-stack",
    courseCode: "CS 2308",
    author: "demo",
    title: "How do I trace what the call stack looks like during recursion?",
    body:
      "When I get a recursive function wrong I cannot tell where it went wrong. Is there a systematic way to trace the stack by hand rather than guessing?",
    answers: [
      {
        key: "a1",
        author: "maya",
        body:
          "Draw one box per call, top to bottom, and write the parameter values in each box before you write any return values. Only once you hit the base case do you fill returns back upward. Doing the two passes separately is what makes it reliable.",
      },
    ],
  },
  {
    key: "q-induction-base",
    courseCode: "MATH 2358",
    author: "demo",
    title: "When does an induction proof need more than one base case?",
    body:
      "Most examples we've done use n = 1. The Fibonacci one used two base cases and I am not sure how to tell when that is required.",
    answers: [
      {
        key: "a1",
        author: "andre",
        body:
          "Count how far back the recurrence reaches. If the inductive step uses P(n-1) and P(n-2), then proving only P(1) leaves P(2) unjustified — the step cannot reach it. You need as many base cases as the depth the recurrence looks back.",
        accepted: true,
      },
    ],
  },
  {
    key: "q-thesis",
    courseCode: "ENG 1310",
    author: "jordan",
    title: "Does a rhetorical analysis thesis need to state whether the argument succeeds?",
    body: "Or is it enough to describe the strategies the author uses?",
    answers: [],
  },
];

async function seedQuestions(users: Record<string, SeededUser>) {
  for (const seed of questionSeeds) {
    const courseId = await courseIdByCode(seed.courseCode);
    const author = users[seed.author]!;
    const id = seedId(seed.key);

    await prisma.courseQuestion.upsert({
      where: { id },
      update: { title: seed.title, body: seed.body },
      create: {
        id,
        courseId,
        authorId: author.id,
        title: seed.title,
        body: seed.body,
      },
    });

    for (const answer of seed.answers) {
      const answerId = seedId(`${seed.key}:${answer.key}`);
      const answerAuthor = users[answer.author]!;

      await prisma.courseAnswer.upsert({
        where: { id: answerId },
        update: { body: answer.body },
        create: { id: answerId, questionId: id, authorId: answerAuthor.id, body: answer.body },
      });

      if (answer.accepted) {
        await prisma.courseQuestion.update({
          where: { id },
          data: { acceptedAnswerId: answerId, status: "SOLVED" },
        });
      }
    }
  }
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

  const users = await seedUsers();
  await seedStudyRequests(users);
  await seedCircles(users);
  await seedSessions(users);
  await seedQuestions(users);

  console.log(
    `Seeded ${departments.length} departments, ${courses.length} courses, ` +
      `${demoUsers.length} demo students, ${requestSeeds.length} study requests, ` +
      `${circleSeeds.length} study circles, ${sessionSeeds.length} sessions, ` +
      `${questionSeeds.length} course questions.`,
  );
  console.log(`Demo login: ${demoUsers[0]!.email} / ${demoPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
