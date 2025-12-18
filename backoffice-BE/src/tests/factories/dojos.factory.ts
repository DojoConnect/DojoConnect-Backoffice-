import { StripePlans } from "../../constants/enums";
import { IDojo } from "../../repositories/dojo.repository";

export const buildDojoMock = (overrides?: Partial<IDojo>): IDojo => {
  return {
    id: "1`",
    userId: "1",
    name: "Desmond Dojo",
    tag: "DESM",
    tagline: "Building champions",
    activeSub: StripePlans.Trial,
    createdAt: new Date("2024-01-10T12:00:00").toISOString(),
    ...overrides, // Allows overriding specific fields for different test scenarios
  };
};
