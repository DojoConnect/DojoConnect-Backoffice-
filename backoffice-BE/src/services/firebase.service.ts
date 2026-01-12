import { initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth } from "firebase-admin/auth";
import * as firebaseMessaging from "firebase-admin/messaging";
import AppConfig from "../config/AppConfig.js";
import { HttpException, UnauthorizedException } from "../core/errors/index.js";
import { isEnumValue } from "../utils/type-guards.utils.js";
import { SupportedOAuthProviders } from "../constants/enums.js";

export interface IFirebaseUser {
  uid: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
  provider: SupportedOAuthProviders;
}

/// set up firebase
let firebaseApp: App | null = null;

let firebaseMessagingInstance: firebaseMessaging.Messaging | null = null;

export class FirebaseService {
  static getFirebaseApp = () => {
    if (firebaseApp) {
      return firebaseApp;
    }
    firebaseApp = initializeApp({
      credential: cert(
        AppConfig.FIREBASE_CRED_FILE_PATH
      ),
    });

    return firebaseApp;
  };

  static getFirebaseMessaging = () => {
    if (firebaseMessagingInstance) {
      return firebaseMessagingInstance;
    }

    firebaseMessagingInstance = firebaseMessaging.getMessaging(
      FirebaseService.getFirebaseApp()
    );

    return firebaseMessagingInstance;
  };

  static getFirebaseAuth = () => {
    return getAuth(FirebaseService.getFirebaseApp());
  };

  static verifyFirebaseToken = async (
    idToken: string
  ): Promise<IFirebaseUser> => {
    try {
      const decodedToken =
        await FirebaseService.getFirebaseAuth().verifyIdToken(idToken);

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
}

