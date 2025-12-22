import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",

  extensionsToTreatAsEsm: [".ts"],
  clearMocks: true,

  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },

  moduleNameMapper: {
    // Fix relative imports ending in .js (required by Node ESM)
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  testMatch: ["**/?(*.)+(spec|test).ts"],
};

export default config;
