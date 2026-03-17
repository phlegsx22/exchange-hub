import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  index,
  integer,
  smallint,
  numeric,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Enums for exchange domain
export const kycStatusEnum = pgEnum("kyc_status", [
  "none",
  "pending",
  "under_review",
  "approved",
  "rejected",
]);

export const kycDocumentTypeEnum = pgEnum("kyc_document_type", [
  "passport",
  "national_id",
  "drivers_license",
]);

export const userRoleEnum = pgEnum("user_role", ["user", "admin", "support"]);

export const accountStatusEnum = pgEnum("account_status", [
  "active",
  "suspended",
  "pending",
  "blacklisted",
]);

/**
 * Users table – core identity for the exchange.
 * Keep sensitive fields (password_hash) and audit fields (email_verified_at, kyc_status).
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    role: userRoleEnum("role").notNull().default("user"),
    accountStatus: accountStatusEnum("account_status").notNull().default("active"),
    emailVerified: boolean("email_verified").notNull().default(false),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    kycStatus: kycStatusEnum("kyc_status").notNull().default("none"),
    kycSubmittedAt: timestamp("kyc_submitted_at", { withTimezone: true }),
    twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
    twoFactorSecret: varchar("two_factor_secret", { length: 255 }),
    canTrade: boolean("can_trade").notNull().default(true),
    canWithdraw: boolean("can_withdraw").notNull().default(true),
    canTransfer: boolean("can_transfer").notNull().default(true),
    canMargin: boolean("can_margin").notNull().default(false),
    canFutures: boolean("can_futures").notNull().default(false),
    canStaking: boolean("can_staking").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (t) => [index("users_email_idx").on(t.email), index("users_kyc_status_idx").on(t.kycStatus)]
);

/**
 * Email verification tokens – short-lived tokens for verifying email on signup/reset.
 */
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * KYC submissions – one row per submission; multiple documents can be stored as references.
 * For an exchange you typically need: personal info, ID document, selfie, and status workflow.
 */
export const kycSubmissions = pgTable(
  "kyc_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    firstName: varchar("first_name", { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }).notNull(),
    dateOfBirth: varchar("date_of_birth", { length: 20 }).notNull(),
    countryOfResidence: varchar("country_of_residence", { length: 3 }).notNull(),
    address: text("address").notNull(),
    phoneNumber: varchar("phone_number", { length: 32 }),
    emergencyContactName: varchar("emergency_contact_name", { length: 255 }),
    emergencyContactPhone: varchar("emergency_contact_phone", { length: 32 }),
    documentType: kycDocumentTypeEnum("document_type").notNull(),
    documentNumber: varchar("document_number", { length: 128 }),
    documentUrl: text("document_url"), // S3 or storage URL in production
    documentBackUrl: text("document_back_url"),
    proofOfAddressUrl: text("proof_of_address_url"),
    selfieUrl: text("selfie_url"),
    // Free-stack review signals (assistive only, never auto-approve).
    ocrConfidence: numeric("ocr_confidence", { precision: 5, scale: 4 }),
    faceMatchScore: numeric("face_match_score", { precision: 5, scale: 4 }),
    livenessScore: numeric("liveness_score", { precision: 5, scale: 4 }),
    ocrExtractedText: text("ocr_extracted_text"),
    reviewNotes: text("review_notes"),
    status: kycStatusEnum("status").notNull().default("pending"),
    rejectionReason: text("rejection_reason"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("kyc_submissions_user_id_idx").on(t.userId),
    index("kyc_submissions_status_idx").on(t.status),
  ]
);

// --- Wallets & multi-network assets (MVP primitives) ---

export const ledgerEntryTypeEnum = pgEnum("ledger_entry_type", [
  "deposit",
  "withdrawal",
  "trade",
  "transfer",
  "fee",
  "adjustment",
]);

export const depositStatusEnum = pgEnum("deposit_status", [
  "pending",
  "confirming",
  "completed",
  "failed",
]);

export const withdrawalStatusEnum = pgEnum("withdrawal_status", [
  "pending",
  "processing",
  "broadcast",
  "completed",
  "failed",
  "cancelled",
]);

export const walletStatusEnum = pgEnum("wallet_status", ["active", "frozen", "pending"]);

export const chains = pgTable(
  "chains",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 32 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    chainId: integer("chain_id"),
    nativeSymbol: varchar("native_symbol", { length: 16 }).notNull(),
    isMainnet: boolean("is_mainnet").notNull().default(true),
    isEvm: boolean("is_evm").notNull().default(false),
    isEnabled: boolean("is_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("chains_slug_idx").on(t.slug)]
);

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    symbol: varchar("symbol", { length: 20 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    decimals: smallint("decimals").notNull(),
    isNative: boolean("is_native").notNull().default(false),
    iconUrl: text("icon_url"),
    isEnabled: boolean("is_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("assets_symbol_idx").on(t.symbol)]
);

export const assetNetworks = pgTable(
  "asset_networks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    chainId: uuid("chain_id")
      .notNull()
      .references(() => chains.id, { onDelete: "cascade" }),
    contractAddress: varchar("contract_address", { length: 66 }),
    isDepositEnabled: boolean("is_deposit_enabled").notNull().default(true),
    isWithdrawEnabled: boolean("is_withdraw_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("asset_network_unique").on(t.assetId, t.chainId),
    index("asset_network_asset_idx").on(t.assetId),
    index("asset_network_chain_idx").on(t.chainId),
  ]
);

export const depositAddresses = pgTable(
  "deposit_addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assetNetworkId: uuid("asset_network_id")
      .notNull()
      .references(() => assetNetworks.id, { onDelete: "cascade" }),
    address: varchar("address", { length: 128 }).notNull(),
    memo: varchar("memo", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("deposit_address_user_asset_network_unique").on(t.userId, t.assetNetworkId),
    index("deposit_address_lookup_idx").on(t.address),
    index("deposit_address_user_idx").on(t.userId),
  ]
);

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assetNetworkId: uuid("asset_network_id")
      .notNull()
      .references(() => assetNetworks.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 36, scale: 18 }).notNull(),
    balanceAfter: numeric("balance_after", { precision: 36, scale: 18 }).notNull(),
    type: ledgerEntryTypeEnum("type").notNull(),
    refType: varchar("ref_type", { length: 32 }),
    refId: uuid("ref_id"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("ledger_user_asset_created_idx").on(t.userId, t.assetNetworkId, t.createdAt),
  ]
);

export const deposits = pgTable(
  "deposits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assetNetworkId: uuid("asset_network_id")
      .notNull()
      .references(() => assetNetworks.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 36, scale: 18 }).notNull(),
    txHash: varchar("tx_hash", { length: 128 }).notNull(),
    fromAddress: varchar("from_address", { length: 128 }),
    confirmations: smallint("confirmations").notNull().default(0),
    status: depositStatusEnum("status").notNull().default("pending"),
    externalId: varchar("external_id", { length: 128 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("deposit_external_unique").on(t.assetNetworkId, t.externalId),
    uniqueIndex("deposit_tx_unique").on(t.assetNetworkId, t.txHash),
    index("deposit_user_idx").on(t.userId),
  ]
);

export const withdrawals = pgTable(
  "withdrawals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assetNetworkId: uuid("asset_network_id")
      .notNull()
      .references(() => assetNetworks.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 36, scale: 18 }).notNull(),
    fee: numeric("fee", { precision: 36, scale: 18 }).notNull().default("0"),
    toAddress: varchar("to_address", { length: 128 }).notNull(),
    txHash: varchar("tx_hash", { length: 128 }),
    status: withdrawalStatusEnum("status").notNull().default("pending"),
    idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("withdraw_idempotency_unique").on(t.userId, t.idempotencyKey),
    index("withdraw_user_idx").on(t.userId),
  ]
);

export const walletAccounts = pgTable(
  "wallet_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assetNetworkId: uuid("asset_network_id")
      .notNull()
      .references(() => assetNetworks.id, { onDelete: "cascade" }),
    status: walletStatusEnum("status").notNull().default("pending"),
    frozen: numeric("frozen", { precision: 36, scale: 18 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("wallet_account_user_asset_network_unique").on(t.userId, t.assetNetworkId),
    index("wallet_account_user_idx").on(t.userId),
  ]
);

/**
 * Refresh tokens (optional) – for rotating JWT refresh if you use access+refresh pattern.
 * Omitted for minimal setup; you can add later.
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type KycSubmission = typeof kycSubmissions.$inferSelect;
