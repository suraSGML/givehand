import { z } from "zod";

// Ethiopian phone number format: +251 9... / 09... / +251 7... / 07...
export const ethiopianPhoneRegex = /^(?:\+251|0)[79]\d{8}$/;

export const applyVolunteerSchema = z.object({
  needItemId: z.string().uuid("Invalid need item ID"),
  shiftId: z.string().uuid("Invalid shift ID").optional().nullable(),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z
    .string()
    .regex(
      ethiopianPhoneRegex,
      "Please provide a valid Ethiopian phone number (e.g. 0911223344 or +251911223344)"
    ),
  message: z
    .string()
    .min(5, "Please provide a brief message explaining your skills or interest")
    .max(500, "Message cannot exceed 500 characters"),
});

export type ApplyVolunteerInput = z.infer<typeof applyVolunteerSchema>;

export const updateVolunteerStatusSchema = z.object({
  applicationId: z.string().uuid("Invalid application ID"),
  status: z.enum([
    "applied",
    "approved",
    "waitlisted",
    "rejected",
    "confirmed",
    "attended",
    "no_show",
    "completed",
    "cancelled",
  ]),
  hoursLogged: z.number().min(0).max(24).optional(),
});

export type UpdateVolunteerStatusInput = z.infer<typeof updateVolunteerStatusSchema>;

export const checkInSchema = z.object({
  token: z.string().min(1, "QR token or application ID is required").optional(),
  phone: z.string().optional(),
  shiftId: z.string().uuid().optional(),
  action: z.enum(["auto", "check_in", "check_out"]).default("auto"),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
