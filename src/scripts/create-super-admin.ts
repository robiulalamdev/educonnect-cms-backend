// // scripts/create-super-admin.ts

// import bcrypt from "bcryptjs";
// import { PrismaClient } from "../database/generated/prisma/client";
// import { env } from "../config/env";
// import { PrismaPg } from "@prisma/adapter-pg";

// const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
// const prisma = new PrismaClient({ adapter });

// async function createSuperAdmin() {
//   const email = "superadmin@cms.com";
//   const password = "SuperAdmin@123$";
//   const name = "Robiul Alam";

//   const existing = await prisma.admin.findUnique({ where: { email } });

//   if (existing) {
//     console.log("⚠️  Super admin already exists:", email);
//     await prisma.$disconnect();
//     return;
//   }

//   const passwordHash = await bcrypt.hash(password, 12);

//   const admin = await prisma.admin.create({
//     data: {
//       full_name: name,
//       email,
//       password: passwordHash,
//       role: "SUPER_ADMIN",
//     },
//   });

//   console.log("✅ Super admin created:");
//   console.log("   Email   :", admin.email);
//   console.log("   Password:", password);
//   console.log("   Role    :", admin.role);
//   console.log("\n⚠️  Change this password after first login!");

//   await prisma.$disconnect();
// }

// createSuperAdmin().catch((err) => {
//   console.error("❌ Failed:", err);
//   prisma.$disconnect();
//   process.exit(1);
// });
