// backend/src/middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * JWT auth middleware
 * - Expects header: Authorization: Bearer <token>
 * - Verifies token and loads user from DB
 * - Attaches req.user = { id, role } on success
 * - Returns 401 for missing/invalid token or unknown user
 */
export default async function authMiddleware(req, res, next) {

  const authHeader = req.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const secret = process.env.JWT_SECRET || "testsecret"; //used "testsecret" as of now which is same as testing
    const payload = jwt.verify(token, secret);

    // payload should contain user id
    if (!payload || !payload.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // ensure user still exists
    const user = await User.findById(payload.id).select("_id role");
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // attach minimal user info to request
    req.user = { id: String(user._id), role: user.role };

    return next();
  } catch (err) {
    // token invalid/expired or verification failed.
    return res.status(401).json({ error: "Unauthorized" });
  }
}