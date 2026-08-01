import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Initial Hyle Edify course catalog. Prices in PAISE (₹1 = 100 paise).
const courses = [
  {
    slug: "basic-maths",
    title: "Basic Maths Course",
    subtitle: "Build rock-solid mathematical foundations",
    priceInPaise: 6_000 * 100,
    sortOrder: 1,
  },
  {
    slug: "class-6-foundation",
    title: "Class 6 Foundation (NEET/JEE)",
    subtitle: "Early-start foundation for NEET & JEE aspirants",
    priceInPaise: 12_000 * 100,
    sortOrder: 2,
  },
  {
    slug: "class-7-foundation",
    title: "Class 7 Foundation (NEET/JEE)",
    subtitle: "Strengthen concepts in Science & Mathematics",
    priceInPaise: 14_000 * 100,
    sortOrder: 3,
  },
  {
    slug: "class-8-foundation",
    title: "Class 8 Foundation (NEET/JEE)",
    subtitle: "Advanced foundation ahead of the competitive curve",
    priceInPaise: 16_000 * 100,
    sortOrder: 4,
  },
];

async function main() {
  for (const course of courses) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        title: course.title,
        subtitle: course.subtitle,
        priceInPaise: course.priceInPaise,
        sortOrder: course.sortOrder,
      },
      create: { ...course, isPublished: true },
    });
  }
  console.log(`Seeded ${courses.length} courses.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
