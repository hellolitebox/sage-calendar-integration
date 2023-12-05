const eslintnext = require("../../.eslintrc")
module.exports = {
 ...eslintnext,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },

  rules: {
    ...eslintnext.rules,
  },
};
