import "server-only";

import admin from "firebase-admin";

function getPrivateKey(): string {
  const key = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!key) return "";
  // Commonly stored with literal \n in env vars
  return key.replace(/\\n/g, "\n");
}

export function getFirebaseAdminApp(): admin.app.App {
  if (admin.apps.length > 0) return admin.app();

  let projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = getPrivateKey();
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY."
    );
  }

  // FCM's v1 send API is scoped by projectId, so a projectId that doesn't
  // match the service account's own project makes every push fail with
  // messaging/mismatched-credential — while RTDB (scoped by databaseURL)
  // keeps working, hiding the misconfiguration. The service account email
  // (<name>@<project-id>.iam.gserviceaccount.com) is authoritative.
  const emailProject = clientEmail.split("@")[1]?.split(".")[0];
  if (emailProject && emailProject !== projectId) {
    console.warn(
      `FIREBASE_ADMIN_PROJECT_ID ("${projectId}") does not match the service account's project ("${emailProject}"). Using "${emailProject}".`
    );
    projectId = emailProject;
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    databaseURL,
  });
}

export function getAdminDatabase(): admin.database.Database {
  const app = getFirebaseAdminApp();
  return app.database();
}

export function getAdminMessaging(): admin.messaging.Messaging {
  const app = getFirebaseAdminApp();
  return app.messaging();
}
