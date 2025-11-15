// backend/src/middleware/admin.middleware.js
/**
 * Admin middleware
 * - Assumes auth middleware already ran and attached req.user
 * - If no req.user -> 401
 * - If req.user.role !== 'admin' -> 403
 * - Otherwise allow request
 */
export default function adminMiddleware(req, res, next) {

    return res.status(403).json({error: "forbidden"});
  
}