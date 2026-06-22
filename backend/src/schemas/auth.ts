import { z } from "zod";

const passwordMin = 8;
const passwordMax = 128;

const passwordStrength = z
  .string()
  .min(passwordMin, `Password must be at least ${passwordMin} characters`)
  .max(passwordMax)
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const optionalPromotionCode = z.preprocess((value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 64) : undefined;
}, z.string().optional());

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: passwordStrength,
    name: z.string().min(1, "Name is required").max(255),
    confirmPassword: z.string(),
    promotionCode: optionalPromotionCode,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
