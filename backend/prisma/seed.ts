/**
 * FaceCloud — Prisma Database Seed
 * Seeds the database with initial users for all three roles:
 *   - user@facecloud.ai   (Role: USER)
 *   - admin@dtm.io        (Role: ADMIN)
 *   - moderator@facecloud.ai (Role: MODERATOR)
 *
 * All passwords are hashed with bcryptjs (cost factor 12).
 * Default password for all seeded accounts: "password"
 *
 * Run with: npm run seed
 */

import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env from root of the project (two levels up from backend/prisma/)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = "password";

interface SeedUser {
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
}

const seedUsers: SeedUser[] = [
  {
    name: "FaceCloud User",
    email: "user@facecloud.ai",
    role: Role.USER,
    status: UserStatus.ACTIVE,
  },
  {
    name: "FaceCloud Admin",
    email: "admin@dtm.io",
    role: Role.ADMIN,
    status: UserStatus.ACTIVE,
  },
  {
    name: "FaceCloud Moderator",
    email: "moderator@facecloud.ai",
    role: Role.MODERATOR,
    status: UserStatus.ACTIVE,
  },
];

async function main(): Promise<void> {
  console.log("🌱 Starting FaceCloud database seed...\n");

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
  console.log(`✅ Password hash generated (cost factor: ${SALT_ROUNDS})\n`);

  for (const seedUser of seedUsers) {
    const user = await prisma.user.upsert({
      where: { email: seedUser.email },
      update: {
        name: seedUser.name,
        role: seedUser.role,
        status: seedUser.status,
        passwordHash,
      },
      create: {
        name: seedUser.name,
        email: seedUser.email,
        passwordHash,
        role: seedUser.role,
        status: seedUser.status,
      },
    });

    console.log(
      `✅ Seeded: ${user.email.padEnd(35)} | Role: ${user.role.padEnd(10)} | ID: ${user.id}`
    );
  }

  console.log("\n🎉 Database seeding complete!");
  console.log("─────────────────────────────────────────────────────");
  console.log("  Seeded Credentials (default password: 'password')");
  console.log("─────────────────────────────────────────────────────");
  console.log("  👤 User       : user@facecloud.ai");
  console.log("  🛡️  Admin      : admin@dtm.io");
  console.log("  🔍 Moderator  : moderator@facecloud.ai");
  console.log("─────────────────────────────────────────────────────\n");
}

main()
  .catch((error: Error) => {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
