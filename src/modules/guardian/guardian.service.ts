import { prisma } from "../../config/prisma.js";
import { UpdateGuardianProfileInput } from "./guardian.schema.js";

/**
 * Update role-specific Guardian profile
 */
export async function updateGuardianProfile(
  userId: string,
  input: UpdateGuardianProfileInput,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deleted_at: null },
    select: { role: true },
  });

  if (!user) throw new Error("NOT_FOUND");
  if (user.role !== "GUARDIAN") throw new Error("INVALID_ROLE");

  return prisma.guardianProfile.update({
    where: { user_id: userId },
    data: input,
  });
}

/**
 * Get guardian details (for internal/admin use or guardian's own view)
 */
export async function getGuardianDetails(userId: string) {
  const guardian = await prisma.user.findFirst({
    where: { 
      id: userId, 
      role: "GUARDIAN", 
      deleted_at: null 
    },
    select: {
      id: true,
      full_name: true,
      avatar: { select: { key: true } },
      guardian_profile: true,
    }
  });

  if (!guardian) throw new Error("NOT_FOUND");
  return guardian;
}
