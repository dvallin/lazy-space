const path = require("path")

module.exports = {
    rootDir: path.resolve(__dirname, "../"),
    moduleFileExtensions: [
        "js",
        "ts",
        "json",
        "vue"
    ],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1"
    },
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(js?|ts?)$",
    testPathIgnorePatterns: [
        "/node_modules/",
        "/obc-components/"
    ],
    transform: {
        "^.+\\.ts$": "<rootDir>/node_modules/ts-jest",
        "^.+\\.js$": "<rootDir>/node_modules/babel-jest"
    },
    setupFiles: ["<rootDir>/test/setup"],
    coverageDirectory: "<rootDir>/coverage",
    collectCoverageFrom: [
        "src/**/*.{js,ts,vue}",
        "!src/main.ts",
        "!**/node_modules/**"
    ]
}
