import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Include all test files — both 2.3 core and 2.4 file uploads
    include: [
      "tests/unit/authorization.test.js",
      "tests/unit/users.controller.test.js",
      "tests/unit/middleware.test.js",
      "tests/unit/token.service.test.js",
      "tests/integration/auth.api.test.js",
      "tests/integration/users.api.test.js",
      "tests/integration/github-oauth.test.js",
      "tests/unit/image.service.test.js",
      "tests/unit/storage.test.js",
      "tests/integration/avatar.api.test.js",
    ],
    // Test-only values. config/env.js refuses to start without a JWT_SECRET.
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-secret-that-is-at-least-32-characters-long",
    },
  },
});
