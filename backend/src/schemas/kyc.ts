import { z } from "zod";

const documentTypes = ["passport", "national_id", "drivers_license"] as const;
const countries = ["us", "uk", "de", "jp", "sg"]; // extend as needed

export const kycPersonalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(255),
  lastName: z.string().min(1, "Last name is required").max(255),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  countryOfResidence: z
    .string()
    .length(2, "Use 2-letter country code")
    .toLowerCase(),
  address: z.string().min(1, "Address is required").max(1000),
});

export const kycDocumentSchema = z.object({
  documentType: z.enum(documentTypes),
  documentUrl: z.string().url().optional(), // optional for upload-in-two-step flows
  selfieUrl: z.string().url().optional(),
});

export const kycSubmitSchema = kycPersonalInfoSchema.merge(kycDocumentSchema);

export type KycPersonalInfoInput = z.infer<typeof kycPersonalInfoSchema>;
export type KycDocumentInput = z.infer<typeof kycDocumentSchema>;
export type KycSubmitInput = z.infer<typeof kycSubmitSchema>;
