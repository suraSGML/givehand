import { z } from "zod";

export const issueCertificateSchema = z.object({
  recipientId: z.string().uuid("Invalid recipient ID"),
  organizationId: z.string().uuid("Invalid organization ID"),
  type: z.enum(["volunteer_service", "donation_receipt", "partner_recognition"]),
  relatedId: z.string().uuid("Invalid related ID").optional().nullable(),
  title: z.string().min(3, "Certificate title must be at least 3 characters"),
  recipientName: z.string().min(2, "Recipient name must be at least 2 characters"),
  hoursLogged: z.number().nonnegative().optional(),
  donationAmount: z.number().nonnegative().optional(),
  campaignTitle: z.string().min(2, "Campaign title is required"),
  notes: z.string().max(500).optional(),
});

export type IssueCertificateInput = z.infer<typeof issueCertificateSchema>;
