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
  phoneNumber: z.string().min(6).max(32).optional(),
  emergencyContactName: z.string().min(1).max(255).optional(),
  emergencyContactPhone: z.string().min(6).max(32).optional(),
});

export const kycDocumentSchema = z.object({
  documentType: z.enum(documentTypes),
  documentNumber: z.string().min(3).max(128).optional(),
  documentUrl: z.string().url().optional(), // optional for upload-in-two-step flows
  documentBackUrl: z.string().url().optional(),
  proofOfAddressUrl: z.string().url().optional(),
  selfieUrl: z.string().url().optional(),
  // Assistive free-stack scores; admin still performs manual final decision.
  ocrConfidence: z.number().min(0).max(1).optional(),
  faceMatchScore: z.number().min(0).max(1).optional(),
  livenessScore: z.number().min(0).max(1).optional(),
  ocrExtractedText: z.string().max(20_000).optional(),
});

export const kycSubmitSchema = kycPersonalInfoSchema.merge(kycDocumentSchema);

export type KycPersonalInfoInput = z.infer<typeof kycPersonalInfoSchema>;
export type KycDocumentInput = z.infer<typeof kycDocumentSchema>;
export type KycSubmitInput = z.infer<typeof kycSubmitSchema>;
