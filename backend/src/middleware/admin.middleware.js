// backend/src/middleware/admin.middleware.js
/**
 * Admin middleware (GREEN)
 * - Expects auth middleware to have attached req.user = { id, role }
 * - If no req.user -> 401 Unauthorized
 * - If req.user.role !== 'admin' -> 403 Forbidden
 * - Otherwise call next()
 */
export default function adminMiddleware(req, res, next) {
  if (!req.user) {
    // auth middleware didn't run or token invalid
    return res.status(401).json({ error: "Unauthorized" });
  }

  // if the role is not admin return 403 
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  return next();
}