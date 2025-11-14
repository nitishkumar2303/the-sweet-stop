// jest.config.js (ESM)
export default {
  testEnvironment: "node",
  transform: {}, // let Node handle ESM
  testMatch: ["**/tests/**/*.test.js"], // ensure it picks your tests
};
