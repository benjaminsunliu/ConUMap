test('CI setup works', () => {
  expect(true).toBe(true);
});

test('should have a valid package.json', () => {
  const packageJson = require("../package.json");
  expect(packageJson.name).toBeDefined();
  expect(packageJson.version).toBeDefined();
});