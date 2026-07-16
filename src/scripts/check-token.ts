import { prisma } from "../config/prisma.js";

async function main() {
  const entries = await prisma.emailQueue.findMany({
    where: {
      to_email: "verifyfix3@test.com",
      template: "email_verification",
    },
    orderBy: { created_at: "desc" },
    take: 3,
  });
  
  for (const entry of entries) {
    const payload = entry.payload as any;
    console.log({
      id: entry.id,
      sent: entry.sent,
      token: payload?.token,
      expires_at: payload?.expires_at,
      created_at: entry.created_at,
    });
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
