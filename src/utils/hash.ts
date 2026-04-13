import bcrypt from "bcryptjs";

/**
 * Hash a plain-text password.
 * Uses bcrypt with 12 salt rounds — matches the pattern used throughout the project.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Compare a plain-text password against a stored bcrypt hash.
 * Returns true if they match, false otherwise.
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
