

export default function authMiddleware(req, res, next) {
  return res.status(401).json({ error: "Unauthorized" });
}