import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import { db, users, emailVerificationTokens } from "../db/index.js";
import { eq } from "drizzle-orm";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from "../schemas/auth.js";
import { signToken, authMiddleware, type AuthRequest } from "../middleware/auth.js";
import { sendVerificationEmail } from "../lib/email.js";
import { z } from "zod";

const router = Router();
const SALT_ROUNDS = 10;
const VERIFICATION_TOKEN_BYTES = 32;
const VERIFICATION_EXPIRY_HOURS = 24;

const adminRegisterSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  bootstrapSecret: z.string().min(1),
});

function createVerificationToken(): { token: string; expiresAt: Date } {
  const token = randomBytes(VERIFICATION_TOKEN_BYTES).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + VERIFICATION_EXPIRY_HOURS);
  return { token, expiresAt };
}

/**
 * POST /auth/register
 * Create user, hash password, create email verification token and send email (stub).
 */
router.post("/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
    return;
  }
  const { email, password, name } = parsed.data;

  try {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    if (existing) {
      res.status(409).json({ error: "Email already registered", code: "EMAIL_TAKEN" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        name: name.trim(),
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        emailVerified: users.emailVerified,
      });

    if (!user) {
      res.status(500).json({ error: "Failed to create user" });
      return;
    }

    const { token, expiresAt } = createVerificationToken();
    await db.insert(emailVerificationTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    const baseUrl = process.env.FRONTEND_URL;
    if (!baseUrl) {
      res.status(500).json({ error: "FRONTEND_URL is not configured", code: "SERVER_MISCONFIG" });
      return;
    }
    const verificationLink = `${baseUrl}/verify-email?token=${token}`;
    await sendVerificationEmail(user.email, verificationLink);

    res.status(201).json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (err) {
    console.error("Register failed:", err);
    res.status(500).json({ error: "Registration failed", code: "SERVER_ERROR" });
  }
});

/**
 * POST /auth/login
 * User login endpoint - ONLY for regular users (role = "user").
 * For non-user roles, return generic invalid credentials (no role leakage).
 */
router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
    return;
  }
  const { email, password } = parsed.data;

  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        passwordHash: users.passwordHash,
        emailVerified: users.emailVerified,
        kycStatus: users.kycStatus,
        role: users.role,
        accountStatus: users.accountStatus,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password", code: "INVALID_CREDENTIALS" });
      return;
    }

    // SECURITY: Block non-user roles from using user login endpoint.
    // Keep response generic to avoid leaking role or admin portal details.
    if (user.role !== "user") {
      res.status(401).json({ error: "Invalid email or password", code: "INVALID_CREDENTIALS" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password", code: "INVALID_CREDENTIALS" });
      return;
    }

    if (user.accountStatus !== "active") {
      res.status(403).json({
        error: "Account is not active",
        code: "ACCOUNT_DISABLED",
        status: user.accountStatus,
      });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({
        error: "Email not verified. Please verify your email before logging in.",
        code: "EMAIL_NOT_VERIFIED",
      });
      return;
    }

    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    const accessToken = signToken({ sub: user.id, email: user.email });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        kycStatus: user.kycStatus,
        role: user.role,
      },
      accessToken,
      expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
    });
  } catch (err) {
    console.error("Login failed:", err);
    res.status(500).json({ error: "Login failed", code: "SERVER_ERROR" });
  }
});

/**
 * POST /auth/admin/login
 * Admin login: email+password only. Does NOT require email verification.
 */
router.post("/admin/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
    return;
  }
  const { email, password } = parsed.data;

  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        passwordHash: users.passwordHash,
        emailVerified: users.emailVerified,
        kycStatus: users.kycStatus,
        role: users.role,
        accountStatus: users.accountStatus,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    // Keep error responses uniform to reduce account enumeration.
    if (!user || user.role !== "admin") {
      res.status(401).json({ error: "Invalid email or password", code: "INVALID_CREDENTIALS" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password", code: "INVALID_CREDENTIALS" });
      return;
    }

    if (user.accountStatus !== "active") {
      res.status(403).json({
        error: "Account is not active",
        code: "ACCOUNT_DISABLED",
        status: user.accountStatus,
      });
      return;
    }

    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    const accessToken = signToken({ sub: user.id, email: user.email });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        kycStatus: user.kycStatus,
        role: user.role,
      },
      accessToken,
      expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
    });
  } catch (err) {
    console.error("Admin login failed:", err);
    res.status(500).json({ error: "Login failed", code: "SERVER_ERROR" });
  }
});

/**
 * POST /auth/admin/register
 * Create an admin user (protected by ADMIN_BOOTSTRAP_SECRET).
 * Does NOT require email verification for admin accounts.
 */
router.post("/admin/register", async (req: Request, res: Response) => {
  const parsed = adminRegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
    return;
  }

  const { name, email, password, bootstrapSecret } = parsed.data;

  const expected = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!expected) {
    res.status(500).json({ error: "Admin bootstrap is not configured", code: "SERVER_MISCONFIG" });
    return;
  }
  if (bootstrapSecret !== expected) {
    res.status(403).json({ error: "Invalid bootstrap secret", code: "FORBIDDEN" });
    return;
  }

  try {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    if (existing) {
      res.status(409).json({ error: "Email already registered", code: "EMAIL_TAKEN" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        name: name.trim(),
        role: "admin",
        accountStatus: "active",
        emailVerified: true,
        emailVerifiedAt: new Date(),
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        emailVerified: users.emailVerified,
        kycStatus: users.kycStatus,
        role: users.role,
      });

    if (!user) {
      res.status(500).json({ error: "Failed to create admin", code: "SERVER_ERROR" });
      return;
    }

    const accessToken = signToken({ sub: user.id, email: user.email });
    res.status(201).json({
      user,
      accessToken,
      expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
    });
  } catch (err) {
    console.error("Admin register failed:", err);
    res.status(500).json({ error: "Admin registration failed", code: "SERVER_ERROR" });
  }
});

/**
 * POST /auth/logout
 * Client discards token; optional server-side blacklist can be added later.
 */
router.post("/logout", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

/**
 * POST /auth/verify-email
 * Consume token and mark user email as verified.
 */
router.post("/verify-email", async (req: Request, res: Response) => {
  const parsed = verifyEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
    return;
  }
  const { token } = parsed.data;

  try {
    const row = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.token, token))
      .limit(1)
      .then((r) => r[0]);

    if (!row || row.usedAt || new Date() > row.expiresAt) {
      res.status(400).json({
        error: "Invalid or expired verification token",
        code: "INVALID_TOKEN",
      });
      return;
    }

    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, row.userId));

    await db
      .update(emailVerificationTokens)
      .set({ usedAt: new Date() })
      .where(eq(emailVerificationTokens.id, row.id));

    res.json({ ok: true, message: "Email verified successfully" });
  } catch (err) {
    console.error("Verify email failed:", err);
    res.status(500).json({ error: "Verification failed", code: "SERVER_ERROR" });
  }
});

/**
 * POST /auth/resend-verification
 * Create new verification token and send email (stub).
 */
router.post("/resend-verification", async (req: Request, res: Response) => {
  const parsed = resendVerificationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.flatten() });
    return;
  }
  const { email } = parsed.data;

  try {
    const [user] = await db
      .select({ id: users.id, email: users.email, emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    if (!user) {
      res.status(404).json({ error: "No account found with this email", code: "NOT_FOUND" });
      return;
    }
    if (user.emailVerified) {
      res.status(400).json({ error: "Email already verified", code: "ALREADY_VERIFIED" });
      return;
    }

    const { token, expiresAt } = createVerificationToken();
    await db.insert(emailVerificationTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    const baseUrl = process.env.FRONTEND_URL;
    if (!baseUrl) {
      res.status(500).json({ error: "FRONTEND_URL is not configured", code: "SERVER_MISCONFIG" });
      return;
    }
    const verificationLink = `${baseUrl}/verify-email?token=${token}`;
    await sendVerificationEmail(user.email, verificationLink);

    res.json({ ok: true, message: "Verification email sent" });
  } catch (err) {
    console.error("Resend verification failed:", err);
    res.status(500).json({ error: "Failed to resend verification", code: "SERVER_ERROR" });
  }
});

/**
 * GET /auth/me
 * Validate JWT and return fresh user data from database.
 * This is the source of truth for user session - frontend should call this on mount.
 */
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  // authMiddleware already fetched fresh user data from DB
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized", code: "NO_TOKEN" });
    return;
  }

  // Check if account is active
  if (req.user.accountStatus !== "active") {
    res.status(403).json({
      error: "Account is not active",
      code: "ACCOUNT_DISABLED",
      status: req.user.accountStatus,
    });
    return;
  }

  // Return fresh user data (never trust client-side storage)
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      emailVerified: req.user.emailVerified,
      kycStatus: req.user.kycStatus,
      accountStatus: req.user.accountStatus,
      canTrade: req.user.canTrade,
      canWithdraw: req.user.canWithdraw,
      canTransfer: req.user.canTransfer,
      canMargin: req.user.canMargin,
      canFutures: req.user.canFutures,
      canStaking: req.user.canStaking,
    },
  });
});

/**
 * POST /auth/logout
 * Invalidate session (for future: add token to blacklist).
 * For now, just acknowledge - client should clear local storage.
 */
router.post("/logout", (_req: Request, res: Response) => {
  // In a production system, you'd add the token to a blacklist here
  // For now, we just acknowledge the logout
  res.json({ ok: true, message: "Logged out successfully" });
});

export default router;
