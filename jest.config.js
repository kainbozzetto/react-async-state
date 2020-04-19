module.exports = {
    roots: ["<rootDir>"],
    transform: {
      "^.+\\.tsx?$": "ts-jest"
    },
    testRegex: "(/tests/.*\\.(test|spec))\\.tsx?$",
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    globals: {
      "ts-jest": {
        "tsConfig": '<rootDir>/tsconfig.test.json'
      }
    },
};
  