import { IDojo } from "../../services/dojos.service";

export const buildDojoMock = (overrides?: Partial<IDojo>): IDojo => {
  return {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    role: "sensei",
    dojo_id: 101,
    dojo_name: "Desmond Dojo",
    dojo_tag: "DESM",
    tagline: "Building champions",
    description:
      "A dojo focused on discipline, growth, and martial arts excellence.",
    created_at: new Date("2024-01-10T12:00:00Z"),

    ...overrides, // Allows overriding specific fields for different test scenarios
  };
};
