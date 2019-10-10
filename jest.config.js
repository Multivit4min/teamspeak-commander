module.exports = {
  transform: {"^.+\\.ts?$": "ts-jest"},
  testEnvironment: "node",
  testRegex: "/tests/.*\\.spec\\.ts$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "d.ts"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**"
  ]
}