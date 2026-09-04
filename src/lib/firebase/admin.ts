import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";

function getServiceAccount() {
  const keyFilePath = path.join(process.cwd(), "firebase-adminsdk.json");
  if (fs.existsSync(keyFilePath)) {
    try {
      const fileData = fs.readFileSync(keyFilePath, "utf8");
      return JSON.parse(fileData);
    } catch (err) {
      console.warn("Failed to parse firebase-adminsdk.json:", err);
    }
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  return null;
}

let app: App;

if (!getApps().length) {
  const serviceAccount = getServiceAccount();
  if (serviceAccount) {
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId || process.env.FIREBASE_PROJECT_ID || "super-trackerr",
    });
  } else {
    app = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "super-trackerr",
    });
  }
} else {
  app = getApps()[0];
}

export const adminAuth: Auth = getAuth(app);
export default app;
