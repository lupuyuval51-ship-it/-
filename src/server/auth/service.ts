import "server-only";
import { db, isUniqueViolation } from "../db";
import { ApiError, Errors } from "../http/errors";
import { hashPassword, verifyAgainstDummy, verifyPassword } from "../security/password";

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  locale: "he" | "en";
  country?: string | null;
}

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export async function registerUser(input: RegisterInput): Promise<{ id: string }> {
  const email = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);
  try {
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        profile: { create: { displayName: input.displayName.trim(), locale: input.locale, country: input.country?.toUpperCase() ?? null } },
      },
      select: { id: true },
    });
    return user;
  } catch (err) {
    if (isUniqueViolation(err, "email")) throw Errors.conflict("EMAIL_TAKEN", "An account with this email already exists.");
    throw err;
  }
}

/** Returns the user id on success; throws a generic 401 otherwise (never reveals whether the email exists). */
export async function verifyCredentials(emailRaw: string, password: string): Promise<string> {
  const user = await db.user.findUnique({ where: { email: normalizeEmail(emailRaw) }, select: { id: true, passwordHash: true } });
  if (!user) {
    await verifyAgainstDummy(password);
    throw new ApiError(401, "INVALID_CREDENTIALS", "Incorrect email or password.");
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new ApiError(401, "INVALID_CREDENTIALS", "Incorrect email or password.");
  return user.id;
}
