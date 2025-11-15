import express from "express";
import "dotenv/config";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import sweetsRoutes from "./routes/sweets.js";

import authMiddleware from "./middleware/auth.middleware.js";
import adminMiddleware from "./middleware/admin.middleware.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/sweets" , sweetsRoutes);

//made this route for testing purpose
app.get("/api/test/protected" , authMiddleware , (req,res)=>{
  return res.json({ok: true});
})

// test-only admin route
app.get("/api/test/admin", authMiddleware, adminMiddleware, (req, res) => {
  return res.json({ ok: true });
});

if (process.env.NODE_ENV !== "test") {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sweetshop";

  mongoose
    .connect(uri)
    .then(() => {
      const PORT = process.env.PORT || 5000;
      app
        .listen(PORT, () => {
          console.log(`Server is running on ${PORT}`);
        })
        .catch((err) => {
          console.error("Mongo Connection error", err);
        });
    });
}

export default app;
