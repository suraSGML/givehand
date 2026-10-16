import { z } from "zod";

export const needItemSchema = z.object({
  itemType: z.enum(["volunteer", "material", "money"]),
  title: z.string().min(1, "Item title is required").max(150),
  description: z.string().optional().nullable(),
  targetQuantity: z.number().optional().nullable(),
  targetAmount: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  // For volunteer shifts
  shifts: z
    .array(
      z.object({
        startsAt: z.string().optional().nullable(),
        endsAt: z.string().optional().nullable(),
        capacity: z.number().min(1).default(10),
      })
    )
    .optional()
    .nullable(),
});

export const createNeedSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(150),
  description: z.string().min(5, "Description must be at least 5 characters"),
  categoryId: z.string().min(1, "Select a category"),
  locationText: z.string().min(1, "Location is required"),
  city: z.string().min(1, "City is required"),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  isRemote: z.boolean().default(false),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  urgency: z.boolean().default(false),
  coverUrl: z.string().optional().nullable().or(z.literal("")),
  status: z.enum(["draft", "open"]).default("open"),
  items: z.array(needItemSchema).min(1, "Add at least one contribution target"),
});

export type CreateNeedInput = z.infer<typeof createNeedSchema>;
export type NeedItemInput = z.infer<typeof needItemSchema>;
