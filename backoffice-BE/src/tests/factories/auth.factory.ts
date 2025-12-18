import {
  Role,
  StripePlans,
  SupportedOAuthProviders,
} from "../../constants/enums";
import { AuthResponseDTO, AuthResponseDTOParams } from "../../dtos/auth.dto";
import { IOAuthAcct } from "../../repositories/oauth-providers.repository";
import {
  INewRefreshToken,
  IRefreshToken,
} from "../../repositories/refresh-token.repository";
import {
  LoginDTO,
  RefreshTokenDTO,
  RegisterDojoAdminDTO,
} from "../../validations/auth.schemas";
import { buildUserDtoMock } from "./user.factory";

export const buildRegisterUserDTOMock = (
  overrides?: Partial<RegisterDojoAdminDTO>
): RegisterDojoAdminDTO => {
  return {
    fullName: "John",
    dojoUsername: "John Doe",
    email: "john.doe@example.com",
    password: "Password123!",
    role: Role.DojoAdmin, // must be a valid Role enum value
    referredBy: "", // optional, defaults to ""
    plan: StripePlans.Trial, // optional, defaults to Trial
    paymentMethod: "pm_1234567890", // any non-empty string
    dojoName: "Phoenix Dojo",
    dojoTag: "phoenix-dojo",
    dojoTagline: "Rise and fight",
    ...overrides, // Allows overriding specific fields for different test scenarios
  };
};

export const buildNewRefreshTokenMock = (
  overrides: Partial<INewRefreshToken>
): INewRefreshToken => {
  return {
    userId: "user-1",
    hashedToken: "hashed",
    expiresAt: new Date(),
    userAgent: "jest",
    userIp: "127.0.0.1",
    ...overrides,
  };
};

export const buildRefreshTokenMock = (
  overrides: Partial<IRefreshToken>
): IRefreshToken => {
  return {
    id: "token-id",
    userId: "user-1",
    hashedToken: "hashed",
    expiresAt: new Date(),
    userAgent: "jest",
    userIp: "127.0.0.1",
    createdAt: new Date(),
    lastUsedAt: new Date(),
    revoked: false,
    ...overrides,
  };
};

export const buildLoginDTOMock = (overrides: Partial<LoginDTO>): LoginDTO => {
  return {
    email: "john.doe@example.com",
    password: "Password123!",
    fcmToken: "fcm-token",
    ...overrides,
  };
};

const buildAuthResponseDTOParamsMMock = (
  overrides?: Partial<AuthResponseDTOParams>
): AuthResponseDTOParams => {
  return {
    accessToken: "access",
    refreshToken: "refresh",
    user: buildUserDtoMock(),
    ...overrides,
  };
};

export const buildAuthResponseDTOMock = (
  overrides?: Partial<AuthResponseDTOParams>
): AuthResponseDTO => {
  return new AuthResponseDTO(
    buildAuthResponseDTOParamsMMock({
      ...overrides,
    })
  );
};

export const buildRefreshTokenDtoMock = (
  overrides?: Partial<RefreshTokenDTO>
): RefreshTokenDTO => {
  return {
    refreshToken: "refresh",
    ...overrides,
  };
};

export const buildOAuthAcctMock = (
  overrides?: Partial<IOAuthAcct>
): IOAuthAcct => {
  return {
    id: "oauth-id",
    userId: "user-1",
    provider: SupportedOAuthProviders.Google,
    providerUserId: "oauth-user-1",
    profileData: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
};
