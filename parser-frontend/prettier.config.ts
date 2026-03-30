import type { Config } from "prettier";

const config: Config = {
  semi: false, // personal preference; pick one and commit
  singleQuote: true,
  trailingComma: "es5", // trailing commas where valid in ES5 (objects, arrays)
  printWidth: 100,
  tabWidth: 2,
  endOfLine: "lf", // consistent line endings across OS
};

export default config;
