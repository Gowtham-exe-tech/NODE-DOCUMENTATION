import { z } from "zod";
// bcrypt only uses the first 72 bytes of a password, so I cap the length at 72.
const passwordRule = z.string().min(8, "Password must be at least 8 characters").max(72, "Password must be at most 72 characters").regex(/[a-z]/, "Password needs a lowercase letter").regex(/[A-Z]/, "Password needs an uppercase letter").regex(/[0-9]/, "Password needs a number");
const emailRule = z.string().trim().toLowerCase().email("Enter a valid email address");
// strict() rejects extra keys, so someone can't sneak in "role": "admin" when registering.
export const registerSchema = z.object({ name: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters"), email: emailRule, password: passwordRule }).strict();
// Login only checks that a password was sent. Strength rules belong to registration.
export const loginSchema = z.object({ email: emailRule, password: z.string().min(1, "Password is required") }).strict();
export const refreshSchema = z.object({ refreshToken: z.string().min(1, "refreshToken is required") }).strict();
