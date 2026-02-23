import { z } from "zod";

const passwordMin = 8;
const passwordMax = 128;

export const registerFormSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(255),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(passwordMin, `At least ${passwordMin} characters`)
      .max(passwordMax)
      .regex(/[A-Z]/, "At least one uppercase letter")
      .regex(/[a-z]/, "At least one lowercase letter")
      .regex(/[0-9]/, "At least one number")
      .regex(/[^A-Za-z0-9]/, "At least one special character"),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
