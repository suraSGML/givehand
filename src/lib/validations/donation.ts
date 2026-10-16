import { z } from "zod";
import { ethiopianPhoneRegex } from "./volunteer";

export const pledgeDonationSchema = z.object({
  needItemId: z.string().uuid("Invalid need item ID"),
  amount: z
    .number()
    .positive("Donation amount must be greater than zero")
    .max(10_000_000, "Maximum single donation is 10,000,000 ETB"),
  method: z.enum(["telebirr", "cbe_birr", "bank_transfer", "chapa", "cash", "other"]),
  referenceNumber: z.string().min(3, "Transaction reference number is required").optional().or(z.literal("")),
  isAnonymous: z.boolean().default(false),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z
    .string()
    .regex(
      ethiopianPhoneRegex,
      "Please provide a valid Ethiopian phone number (e.g. 0911223344)"
    ),
  notes: z.string().max(500).optional(),
});

export type PledgeDonationInput = z.infer<typeof pledgeDonationSchema>;

export const confirmDonationSchema = z.object({
  donationId: z.string().uuid("Invalid donation ID"),
  status: z.enum(["confirmed", "rejected"]),
  rejectionReason: z.string().max(500).optional(),
});

export type ConfirmDonationInput = z.infer<typeof confirmDonationSchema>;
