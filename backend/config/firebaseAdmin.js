const admin = require("firebase-admin");

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const isFirebaseAdminConfigured = Boolean(projectId && clientEmail && privateKey);

if (isFirebaseAdminConfigured && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

module.exports = {
  firebaseAdmin: isFirebaseAdminConfigured ? admin : null,
  isFirebaseAdminConfigured,
};
