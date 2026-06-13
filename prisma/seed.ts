/**
 * Database seed for Travel Amigo.
 *
 * Seeds the Place table from the frontend mock data (travel-amigo/data/),
 * mapping each frontend Place shape onto the Prisma Place model:
 *   category → type, latitude/longitude → lat/lng,
 *   shortDescription → description, destination region → region.
 *
 * Also creates a default admin user (ADMIN_EMAIL/ADMIN_PASSWORD env vars,
 * dev-only fallback credentials otherwise).
 *
 * Run with: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { places } from "./seed-data/places";
import { destinations } from "./seed-data/destinations";

const prisma = new PrismaClient();

async function seedPlaces(): Promise<void> {
  const regionByDestination = new Map(destinations.map((d) => [d.id, d.region]));

  for (const place of places) {
    await prisma.place.upsert({
      where: { id: place.id },
      create: {
        id: place.id,
        name: place.name,
        region: regionByDestination.get(place.destination) ?? "cultural",
        type: place.category,
        lat: place.latitude,
        lng: place.longitude,
        description: place.shortDescription,
        destination: place.destination,
        tags: place.tags,
        estimatedVisitDurationMinutes: place.estimatedVisitDurationMinutes,
        estimatedCostLkr: place.estimatedCostLkr,
        bestTimeToVisit: place.bestTimeToVisit,
        travelTip: place.travelTip,
        gradientPlaceholder: place.gradientPlaceholder,
        suitableFor: place.suitableFor,
        interests: place.interests,
      },
      update: {
        name: place.name,
        region: regionByDestination.get(place.destination) ?? "cultural",
        type: place.category,
        lat: place.latitude,
        lng: place.longitude,
        description: place.shortDescription,
        destination: place.destination,
        tags: place.tags,
        estimatedVisitDurationMinutes: place.estimatedVisitDurationMinutes,
        estimatedCostLkr: place.estimatedCostLkr,
        bestTimeToVisit: place.bestTimeToVisit,
        travelTip: place.travelTip,
        gradientPlaceholder: place.gradientPlaceholder,
        suitableFor: place.suitableFor,
        interests: place.interests,
      },
    });
  }
  console.log(`Seeded ${places.length} places.`);
}

async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL ?? "admin@travelamigo.local";
  const password = process.env.ADMIN_PASSWORD ?? "admin-dev-password";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, role: "admin", emailVerified: true },
    update: { role: "admin" },
  });
  console.log(`Seeded admin user ${email}.`);
}

async function main(): Promise<void> {
  await seedPlaces();
  await seedAdmin();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
