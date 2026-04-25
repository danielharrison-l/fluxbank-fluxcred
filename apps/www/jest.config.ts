import baseConfig from "@loci/config/jest";
import type { Config } from "jest";

const config: Config = {
  ...baseConfig,
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: [
    ...(baseConfig.testPathIgnorePatterns ?? []),
    "/e2e-tests/",
  ],
};

export default config;
