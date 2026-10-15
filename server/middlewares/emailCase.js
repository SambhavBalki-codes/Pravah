export const requireExactEmailCase = (req, res, next) => {
  const email = String(req.body?.email ?? "").trim();
  if (email !== email.toLowerCase()) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }
  next();
};