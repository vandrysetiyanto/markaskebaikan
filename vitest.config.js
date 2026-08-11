import { defineConfig } from "vite";

export default defineConfig({
  test: {
    environment: "jsdom",
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
