import express from "express";
import "dotenv/config";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import sweetsRoutes from "./routes/sweets.js";
import categoriesRoutes from "./routes/categories.js";

import authMiddleware from "./middleware/auth.middleware.js";
import adminMiddleware from "./middleware/admin.middleware.js";
import User from "./models/User.js";

const app = express();

const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173")
  .replace(/^['"]|['"]$/g, "");

app.use(
  cors({
    origin: (origin, cb) => {
      // allow requests from tools and server-to-server (no origin)
      if (!origin) return cb(null, true);

      // allow explicitly configured frontend URL (production)
      if (origin === FRONTEND_URL) return cb(null, true);

      // allow local dev
      if (origin === "http://localhost:5173" || origin === "http://127.0.0.1:5173")
        return cb(null, true);

      // allow Vercel preview + vercel.app domains (so frontend deployed on vercel can call backend)
      try {
        if (typeof origin === "string" && origin.endsWith(".vercel.app")) {
          return cb(null, true);
        }
      } catch (e) {
        // fall through to reject
      }

      // otherwise reject
      return cb(new Error("CORS not allowed"), false);
    },
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);



app.use(express.json());

// --- API routes
app.use("/api/auth", authRoutes);
app.use("/api/sweets", sweetsRoutes);
app.use("/api/categories", categoriesRoutes);

// demo test routes
app.get("/api/test/protected", authMiddleware, (req, res) => {
  return res.json({ ok: true });
});
app.get("/api/test/admin", authMiddleware, adminMiddleware, (req, res) => {
  return res.json({ ok: true });
});

// --- Helper: normalize URI from .env (remove accidental quotes)
let mongoUri = (process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sweetshop")
  .replace(/^['"]|['"]$/g, "");

// Connect to MongoDB — avoid reconnecting if already connected (helps serverless)
async function ensureMongo() {
  if (mongoose.connection.readyState === 1) {
    // already connected
    return;
  }
  // recommended options
  const opts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  await mongoose.connect(mongoUri, opts);
}

async function startServerIfNeeded() {
  try {
    await ensureMongo();

    // If running locally (not serverless/Vercel), start the HTTP listener.
    // Vercel (and many serverless providers) expect you to export the app and NOT call listen.
    const isServerless = !!process.env.VERCEL || process.env.NODE_ENV === "serverless";
    if (!isServerless) {
      const PORT = process.env.PORT || 5000;
      const server = app.listen(PORT, () => {
        console.log(`Server is running on ${PORT}`);
      });

      server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.error(`❌ Port ${PORT} is already in use.`);
          process.exit(1);
        } else {
          console.error("Server error:", err);
        }
      });
    } else {
      console.log("Running in serverless mode (no local listen).");
    }

    // Demo user seeding (optional) — only if not disabled
    if (process.env.DISABLE_DEMO_SEED !== "true") {
      try {
        const demoAccounts = [
          {
            name: "Admin Demo",
            email: "admin@example.com",
            password: "Admin123!",
            role: "admin",
          },
          {
            name: "User Demo",
            email: "user@example.com",
            password: "User123!",
            role: "user",
          },
        ];

        for (const acct of demoAccounts) {
          const exists = await User.findOne({ email: acct.email });
          if (!exists) {
            const u = new User({
              name: acct.name,
              email: acct.email,
              password: acct.password,
              role: acct.role,
            });
            await u.save();
            console.log(`Seeded demo account: ${acct.email} (${acct.role})`);
          }
        }
      } catch (err) {
        console.error("Error seeding demo users:", err);
      }
    } else {
      console.log("Demo seeding disabled via DISABLE_DEMO_SEED=true");
    }
  } catch (err) {
    console.error("Startup/Mongo error:", err);
  }
}

// Only attempt to start when not in test environment.
// For tests we usually import the app and manage connection from tests.
if (process.env.NODE_ENV !== "test") {
  // Print a trimmed preview of the Mongo URI (safe-ish)
  try {
    const preview = mongoUri.length > 80 ? mongoUri.slice(0, 80) + "..." : mongoUri;
    console.log("Attempting Mongo connect to:", preview);
  } catch (e) {
    console.log("Attempting Mongo connect (unable to preview uri)");
  }

  startServerIfNeeded();
}

// Export the app so serverless platforms (Vercel) or tests can import it.
export default app;