import { z } from "zod";
import { ethiopianPhoneRegex } from "./volunteer";

export const pledgeMaterialSchema = z.object({
  needItemId: z.string().uuid("Invalid need item ID"),
  quantity: z
    .number()
    .positive("Quantity must be greater than zero")
    .max(10000, "Maximum quantity exceeded"),
  deliveryMethod: z.enum(["dropoff", "pickup_requested", "courier"]),
  pickupAddress: z.string().optional(),
  conditionNote: z.string().min(2, "Please select or provide the item condition"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z
    .string()
    .regex(
      ethiopianPhoneRegex,
      "Please provide a valid Ethiopian phone number (e.g. 0911223344 or +251911223344)"
    ),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
});

export type PledgeMaterialInput = z.infer<typeof pledgeMaterialSchema>;

export const receiveMaterialSchema = z.object({
  pledgeId: z.string().uuid("Invalid pledge ID"),
  receivedQuantity: z
    .number()
    .min(0, "Received quantity cannot be negative")
    .max(10000),
  status: z.enum(["received", "partially_received", "rejected", "in_transit", "delivered"]),
  inspectionNote: z.string().max(500).optional(),
});

export type ReceiveMaterialInput = z.infer<typeof receiveMaterialSchema>;
