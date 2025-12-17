import { DecodedIdToken } from "firebase-admin/auth";
import { SupportedOAuthProviders } from "../../constants/enums";
import { IFirebaseUser } from "../../services/firebase.service";

export const buildDecodedIdTokenMock = (overrides?: Partial<DecodedIdToken>) => {
  return {
    uid: "firebase-uid",
    email: "user@example.com",
    name: "John Doe",
    picture: "https://avatar.com/pic.png",
    email_verified: true,
    signInProvider: `${SupportedOAuthProviders.Google}.com`,
    ...overrides,
  };
};

export const buildFirebaseUserMock = (overrides? : Partial<IFirebaseUser>): IFirebaseUser => {
    return {
      uid: "firebase-uid",
      email: "user@example.com",
      emailVerified: true,
      name: "John Doe",
      picture: "avatar.png",
      provider: SupportedOAuthProviders.Google,
      ...overrides
    };
}
