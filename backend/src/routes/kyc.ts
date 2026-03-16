import { Router, Response } from "express";
import { createHash, randomUUID } from "node:crypto";
import { db, users, kycSubmissions } from "../db/index.js";
import { eq, desc } from "drizzle-orm";
import { kycSubmitSchema } from "../schemas/kyc.js";
import type { AuthRequest } from "../middleware/auth.js";
import { authMiddleware, requireAccountActive, requireVerified } from "../middleware/auth.js";

const router = Router();

/**
 * GET /kyc/status
 * Return current user's KYC status (from users.kycStatus and latest submission if any).
 */
router.get("/status", authMiddleware, requireVerified, requireAccountActive, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const [user] = await db
      .select({ kycStatus: users.kycStatus, kycSubmittedAt: users.kycSubmittedAt })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);
    const [latest] = await db
      .select({
        id: kycSubmissions.id,
        status: kycSubmissions.status,
        rejectionReason: kycSubmissions.rejectionReason,
        submittedAt: kycSubmissions.submittedAt,
      })
      .from(kycSubmissions)
      .where(eq(kycSubmissions.userId, req.user.id))
      .orderBy(desc(kycSubmissions.submittedAt))
      .limit(1);
    res.json({
      kycStatus: user?.kycStatus ?? "none",
      kycSubmittedAt: user?.kycSubmittedAt ?? null,
      latestSubmission: latest ?? null,
    });
  } catch (err) {
    console.error("KYC status failed:", err);
    res.status(500).json({ error: "Failed to load KYC status", code: "SERVER_ERROR" });
  }
});

/**
 * POST /kyc/submit
 * Submit KYC personal info and document/selfie URLs. In production, upload files to S3 first and pass URLs.
 */
router.post("/submit", authMiddleware, requireVerified, requireAccountActive, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = kycSubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;

  try {
    const [submission] = await db
      .insert(kycSubmissions)
      .values({
        userId: req.user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        countryOfResidence: data.countryOfResidence,
        address: data.address,
        phoneNumber: data.phoneNumber ?? null,
        emergencyContactName: data.emergencyContactName ?? null,
        emergencyContactPhone: data.emergencyContactPhone ?? null,
        documentType: data.documentType,
        documentNumber: data.documentNumber ?? null,
        documentUrl: data.documentUrl ?? null,
        documentBackUrl: data.documentBackUrl ?? null,
        proofOfAddressUrl: data.proofOfAddressUrl ?? null,
        selfieUrl: data.selfieUrl ?? null,
        ocrConfidence:
          typeof data.ocrConfidence === "number" ? String(data.ocrConfidence) : null,
        faceMatchScore:
          typeof data.faceMatchScore === "number" ? String(data.faceMatchScore) : null,
        livenessScore:
          typeof data.livenessScore === "number" ? String(data.livenessScore) : null,
        ocrExtractedText: data.ocrExtractedText ?? null,
        status: "pending",
      })
      .returning();

    await db
      .update(users)
      .set({
        kycStatus: "pending",
        kycSubmittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user.id));

    res.status(201).json({
      submissionId: submission?.id,
      status: "pending",
      message: "KYC submitted for review",
    });
  } catch (err) {
    console.error("KYC submit failed:", err);
    res.status(500).json({ error: "KYC submission failed", code: "SERVER_ERROR" });
  }
});

function cloudinarySignature(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");
}

/**
 * POST /kyc/upload-signature
 * Return Cloudinary signature params for direct client upload.
 */
router.post(
  "/upload-signature",
  authMiddleware,
  requireVerified,
  requireAccountActive,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "NO_TOKEN" });
      return;
    }

    const kindRaw = (req.body?.kind as string | undefined) ?? "";
    const kind =
      kindRaw === "document" ||
      kindRaw === "selfie" ||
      kindRaw === "document_back" ||
      kindRaw === "proof_of_address"
        ? kindRaw
        : null;
    if (!kind) {
      res.status(400).json({ error: "Invalid kind", code: "VALIDATION_FAILED" });
      return;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      res.status(500).json({
        error: "Cloudinary not configured",
        code: "SERVER_ERROR",
      });
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder =
      process.env.CLOUDINARY_FOLDER ?? `annex-ebank/kyc/${req.user.id}`;
    const publicId = `${kind}-${randomUUID()}`;

    const signature = cloudinarySignature(
      {
        folder,
        public_id: publicId,
        timestamp,
      },
      apiSecret
    );

    res.json({
      ok: true,
      cloudName,
      apiKey,
      timestamp,
      folder,
      publicId,
      signature,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    });
  }
);

export default router;
