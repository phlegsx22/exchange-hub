import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import kycRoutes from "./routes/kyc.js";
import adminRoutes from "./routes/admin.js";
import balancesRoutes from "./routes/balances.js";
import walletsRoutes from "./routes/wallets.js";

const app = express();
const PORT = process.env.API_PORT ?? process.env.SERVER_PORT ?? 3000;

const configuredOrigins = (process.env.FRONTEND_URLS ?? process.env.FRONTEND_URL ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const devDefaultOrigins = [
  "http://localhost:4173",
  "https://annex-ebank.com/"
];

const allowedOrigins = configuredOrigins.length ? configuredOrigins : devDefaultOrigins;

app.use(
  cors({
    origin: (origin, cb) => {
      // allow non-browser tools (curl, server-to-server)
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);

      // In dev, allow localhost on any port to reduce friction.
      if (
        process.env.NODE_ENV !== "production" &&
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return cb(null, true);
      }

      return cb(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/kyc", kycRoutes);
app.use("/admin", adminRoutes);
app.use("/balances", balancesRoutes);
app.use("/wallets", walletsRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "exchange-hub-api" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
