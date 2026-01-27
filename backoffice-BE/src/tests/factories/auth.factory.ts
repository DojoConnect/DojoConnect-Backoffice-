import { faker } from "@faker-js/faker";
import { StripePlans, SupportedOAuthProviders } from "../../constants/enums.js";
import { AuthResponseDTO, AuthResponseDTOParams } from "../../dtos/auth.dtos.js";
import { IOAuthAcct } from "../../repositories/oauth-providers.repository.js";
import { INewRefreshToken, IRefreshToken } from "../../repositories/refresh-token.repository.js";
import {
  ChangePasswordDTO,
  LoginDTO,
  RefreshTokenDTO,
  RegisterDojoAdminDTO,
  RegisterParentDTO,
} from "../../validations/auth.schemas.js";
import { buildUserDtoMock } from "./user.factory.js";

export const buildRegisterDojoAdminDTOMock = (
  overrides?: Partial<RegisterDojoAdminDTO>,
): RegisterDojoAdminDTO => {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    username: "John Doe",
    email: "john.doe@example.com",
    password: "Password123!",
    referredBy: "", // optional, defaults to ""
    plan: StripePlans.Monthly, // optional, defaults to Trial
    dojoName: "Phoenix Dojo",
    dojoTag: "phoenix-dojo",
    dojoTagline: "Rise and fight",
    ...overrides, // Allows overriding specific fields for different test scenarios
  };
};

export const buildRegisterParentDTOMock = (
  overrides: Partial<RegisterParentDTO>,
): RegisterParentDTO => {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    username: faker.internet.username(),
    email: "john.doe@example.com",
    password: "Password123!",
    fcmToken: "fcm-token",
    ...overrides,
  };
};

export const buildNewRefreshTokenMock = (
  overrides: Partial<INewRefreshToken>,
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

export const buildRefreshTokenMock = (overrides: Partial<IRefreshToken>): IRefreshToken => {
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
  overrides?: Partial<AuthResponseDTOParams>,
): AuthResponseDTOParams => {
  return {
    accessToken: "access",
    refreshToken: "refresh",
    userDto: buildUserDtoMock(),
    ...overrides,
  };
};

export const buildAuthResponseDTOMock = (
  overrides?: Partial<AuthResponseDTOParams>,
): AuthResponseDTO => {
  return new AuthResponseDTO(
    buildAuthResponseDTOParamsMMock({
      ...overrides,
    }),
  );
};

export const buildRefreshTokenDtoMock = (overrides?: Partial<RefreshTokenDTO>): RefreshTokenDTO => {
  return {
    refreshToken: "refresh",
    ...overrides,
  };
};

export const buildOAuthAcctMock = (overrides?: Partial<IOAuthAcct>): IOAuthAcct => {
  return {
    id: "oauth-id",
    userId: "user-1",
    provider: SupportedOAuthProviders.Google,
    providerUserId: "oauth-user-1",
    profileData: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const buildChangePasswordDTOMock = (overrides?: Partial<ChangePasswordDTO>): ChangePasswordDTO => {
  return {
    oldPassword: "old-password",
    newPassword: "new-password",
    ...overrides,
  };
};
