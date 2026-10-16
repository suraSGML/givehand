/**
 * Zod validation schemas for authentication forms.
 * These are shared between client (React Hook Form) and server (server actions).
 */
import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name too long"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password too long"),
    confirmPassword: z.string(),
    role: z.enum(["supporter", "organization"], {
      message: "Please select a role",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const supporterProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  phone: z.string().optional(),
  city: z.string().min(1, "City is required"),
  subcity: z.string().optional(),
  bio: z.string().max(500).optional(),
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  availability: z.string().optional(),
});

export const organizationProfileSchema = z.object({
  name: z.string().min(2, "Organization name is required").max(150),
  description: z.string().max(1000).optional(),
  categoryId: z.string().uuid().optional(),
  address: z.string().max(300).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  registrationNumber: z.string().max(100).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type SupporterProfileInput = z.infer<typeof supporterProfileSchema>;
export type OrganizationProfileInput = z.infer<
  typeof organizationProfileSchema
>;
