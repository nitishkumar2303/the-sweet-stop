import express from "express";
import "dotenv/config";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import sweetsRoutes from "./routes/sweets.js";

import authMiddleware from "./middleware/auth.middleware.js";
import adminMiddleware from "./middleware/admin.middleware.js";

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
    })
    .catch((err) => {
      console.error("Mongo Connection error:", err);
    });
}

export default app;
