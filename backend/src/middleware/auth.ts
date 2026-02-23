import type { Request, Response, NextFunction } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { User } from "../db/schema.js";
import { db, users } from "../db/index.js";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET ?? "change-me-in-production";

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: Pick<
    User,
    | "id"
    | "email"
    | "role"
    | "emailVerified"
    | "kycStatus"
    | "accountStatus"
    | "canTrade"
    | "canWithdraw"
    | "canTransfer"
    | "canMargin"
    | "canFutures"
    | "canStaking"
  >;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ error: "Unauthorized", code: "NO_TOKEN" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      emailVerified: users.emailVerified,
      kycStatus: users.kycStatus,
      accountStatus: users.accountStatus,
      canTrade: users.canTrade,
      canWithdraw: users.canWithdraw,
      canTransfer: users.canTransfer,
      canMargin: users.canMargin,
      canFutures: users.canFutures,
      canStaking: users.canStaking,
    })
      .from(users)
      .where(eq(users.id, decoded.sub))
      .limit(1)
      .then(([u]) => {
        if (!u) {
          res.status(401).json({ error: "Invalid token user", code: "INVALID_TOKEN" });
          return;
        }
        req.user = u as AuthRequest["user"];
        next();
      })
      .catch((err) => {
        console.error("Auth lookup failed:", err);
        res.status(500).json({ error: "Auth failed", code: "SERVER_ERROR" });
      });
  } catch {
    res.status(401).json({ error: "Invalid or expired token", code: "INVALID_TOKEN" });
  }
}

export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      emailVerified: users.emailVerified,
      kycStatus: users.kycStatus,
      accountStatus: users.accountStatus,
      canTrade: users.canTrade,
      canWithdraw: users.canWithdraw,
      canTransfer: users.canTransfer,
      canMargin: users.canMargin,
      canFutures: users.canFutures,
      canStaking: users.canStaking,
    })
      .from(users)
      .where(eq(users.id, decoded.sub))
      .limit(1)
      .then(([u]) => {
        if (u) req.user = u as AuthRequest["user"];
        next();
      })
      .catch(() => next());
  } catch {
    // ignore invalid token for optional auth
  }
}

export function requireVerified(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized", code: "NO_TOKEN" });
    return;
  }
  if (!req.user.emailVerified) {
    res.status(403).json({ error: "Email not verified", code: "EMAIL_NOT_VERIFIED" });
    return;
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized", code: "NO_TOKEN" });
    return;
  }
  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
    return;
  }
  if (req.user.accountStatus !== "active") {
    res.status(403).json({
      error: "Account is not active",
      code: "ACCOUNT_DISABLED",
      status: req.user.accountStatus,
    });
    return;
  }
  next();
}

export function requireAccountActive(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized", code: "NO_TOKEN" });
    return;
  }
  if (req.user.accountStatus !== "active") {
    res.status(403).json({
      error: "Account is not active",
      code: "ACCOUNT_DISABLED",
      status: req.user.accountStatus,
    });
    return;
  }
  next();
}

export function requireCanWithdraw(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized", code: "NO_TOKEN" });
    return;
  }
  if (!req.user.canWithdraw) {
    res.status(403).json({ error: "Withdrawals disabled", code: "WITHDRAW_DISABLED" });
    return;
  }
  next();
}

export function requireCanTrade(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized", code: "NO_TOKEN" });
    return;
  }
  if (!req.user.canTrade) {
    res.status(403).json({ error: "Trading disabled", code: "TRADING_DISABLED" });
    return;
  }
  next();
}

export function requireCanTransfer(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized", code: "NO_TOKEN" });
    return;
  }
  if (!req.user.canTransfer) {
    res.status(403).json({ error: "Transfers disabled", code: "TRANSFER_DISABLED" });
    return;
  }
  next();
}

export function signToken(payload: JwtPayload): string {
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as SignOptions);
}
