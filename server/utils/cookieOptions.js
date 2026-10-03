const isProduction = process.env.NODE_ENV === "production";

export const authCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: process.env.COOKIE_SAME_SITE || (isProduction ? "none" : "lax"),
};
