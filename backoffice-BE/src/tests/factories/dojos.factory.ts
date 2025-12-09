import { IDojo } from "../../services/dojos.service";

export const buildDojoMock = (overrides?: Partial<IDojo>): IDojo => {
  return {
    id: 1,
    userEmail: "john.doe@example.com",
    dojoName: "Desmond Dojo",
    dojoTag: "DESM",
    dojoTagline: "Building champions",
    createdAt: new Date("2024-01-10T12:00:00Z").toISOString(),
    ...overrides, // Allows overriding specific fields for different test scenarios
  };
};
