import { SupportedOAuthProviders } from "../constants/enums.js";

export const isSupportedOAuthProvider = (provider: string): provider is SupportedOAuthProviders => {
  return Object.values(SupportedOAuthProviders).includes(provider as SupportedOAuthProviders);
};

export const isEnumValue = <T extends { [k: string]: string }>(
  something: any,
  enumObject: T,
): something is T[keyof T] =>
  typeof something === "string" && Object.values(enumObject).includes(something);
