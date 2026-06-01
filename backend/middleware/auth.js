const jwt = require("jsonwebtoken");
const {
  firebaseAdmin,
  isFirebaseAdminConfigured,
} = require("../config/firebaseAdmin");

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return res.status(401).json({
      error: "Authentication token is required.",
    });
  }

  if (process.env.JWT_SECRET) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      return next();
    } catch (error) {
      // Not an app JWT. Try Firebase ID token below.
    }
  }

  if (isFirebaseAdminConfigured && firebaseAdmin) {
    try {
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
      req.user = {
        id: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        provider: "firebase",
      };
      return next();
    } catch (error) {
      return res.status(401).json({
        error: "Firebase session expired. Please log in again.",
      });
    }
  }

  if (!process.env.JWT_SECRET && !isFirebaseAdminConfigured) {
    return res.status(500).json({
      error:
        "Authentication is not configured. Add JWT_SECRET or Firebase Admin environment variables.",
    });
  }

  if (!isFirebaseAdminConfigured) {
    return res.status(401).json({
      error:
        "Session expired or Firebase Admin is not configured on the backend.",
    });
  }
}

module.exports = authMiddleware;
