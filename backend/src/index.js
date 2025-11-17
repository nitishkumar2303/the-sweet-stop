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

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/sweets", sweetsRoutes);
app.use("/api/categories", categoriesRoutes);

//made this route for testing purpose
app.get("/api/test/protected", authMiddleware, (req, res) => {
  return res.json({ ok: true });
});

// test-only admin route
app.get("/api/test/admin", authMiddleware, adminMiddleware, (req, res) => {
  return res.json({ ok: true });
});

if (process.env.NODE_ENV !== "test") {
  let uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sweetshop";

  // Strip surrounding single/double quotes if present (common .env mistake)
  uri = uri.replace(/^['\"]|['\"]$/g, "");

  // Log an attempt to connect (trimmed for safety)
  try {
    const preview = uri.length > 80 ? uri.slice(0, 80) + "..." : uri;
    console.log("Attempting Mongo connect to:", preview);
  } catch (e) {
    console.log("Attempting Mongo connect (unable to preview uri)");
  }

  mongoose
    .connect(uri)
    .then(() => {
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

      // Seed demo accounts (useful for hosting a live demo where
      // recruiters can sign in without registering). Runs once
      // after the server starts if the accounts are missing.
      // Can be disabled by setting `DISABLE_DEMO_SEED=true` in the environment.
      if (process.env.DISABLE_DEMO_SEED !== "true") {
        (async function seedDemoUsers() {
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
                console.log(
                  `Seeded demo account: ${acct.email} (${acct.role})`
                );
              }
            }
          } catch (err) {
            console.error("Error seeding demo users:", err);
          }
        })();
      } else {
        console.log("Demo seeding disabled via DISABLE_DEMO_SEED=true");
      }
    })
    .catch((err) => {
      console.error("Mongo Connection error:", err);
    });
}

export default app;
