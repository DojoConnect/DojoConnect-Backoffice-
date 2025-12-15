import * as firebaseAdmin from "firebase-admin";
import * as firebaseMessaging from "firebase-admin/messaging";
import AppConfig from "../config/AppConfig";
import { HttpException, UnauthorizedException } from "../core/errors";
import { isEnumValue } from "../utils/type-guards.utils";
import { SupportedOAuthProviders } from "../constants/enums";

export interface IFirebaseUser {
  uid: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
  provider: SupportedOAuthProviders;
}

/// set up firebase
let firebaseApp: firebaseAdmin.app.App | null = null;

let firebaseMessagingInstance: firebaseMessaging.Messaging | null = null;

export const getFirebaseApp = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  firebaseApp = firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(
      AppConfig.FIREBASE_CRED_FILE_PATH
    ),
  });

  return firebaseApp;
};

export const getFirebaseMessaging = () => {
  if (firebaseMessagingInstance) {
    return firebaseMessagingInstance;
  }

  firebaseMessagingInstance = firebaseMessaging.getMessaging(getFirebaseApp());

  return firebaseMessagingInstance;
};

export const getFirebaseAuth = () => {
  return getFirebaseApp().auth();
};

export const verifyFirebaseToken = async (idToken: string): Promise<IFirebaseUser> => {
  try {
    const decodedToken = await getFirebaseAuth().verifyIdToken(idToken);

    if (!decodedToken) throw new UnauthorizedException("Invalid Token");

    const provider = decodedToken.signInProvider.replace(".com", "");

    if (!isEnumValue(provider, SupportedOAuthProviders)) {
      throw new UnauthorizedException("Unsupported Auth provider");
    }

    if (!decodedToken.email) {
      throw new UnauthorizedException("Email not provided by auth provider");
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      emailVerified: decodedToken.email_verified || false,
      provider,
    };
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }

    console.error("Error verifying Google token:", error);
    throw new UnauthorizedException("Authentication failed");
  }
};
