module.exports = {
  root: true,

  env: { browser: true, es2020: true },

  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],

  ignorePatterns: ["build"],

  parser: "@typescript-eslint/parser",

  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        "varsIgnorePattern": "jsx|Fragment|^_",
        "destructuredArrayIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "jsx",
      },
    ],
    "arrow-spacing": ["warn", { "before": true, "after": true }],
    "indent": ["warn", 2, { "SwitchCase": 1 }],
    "linebreak-style": [
      "error",
      "unix",
    ],
    "eqeqeq": ["warn", "smart"],
    "quotes": [2, "double", "avoid-escape"],
    "@typescript-eslint/semi": ["warn", "always", { "omitLastInOneLineBlock": true }],
    "a11y-media-has-caption": "off",
    "max-len": [
      "warn", {
        "code": 120,
        "tabWidth": 4,
        "ignoreComments": true,
      },
    ],
    "no-console": ["warn", { "allow": ["error", "info", "warn"] }],
    "no-fallthrough": ["error", { "commentPattern": "break[\\s\\w]*omitted" }],
    "no-param-reassign": [
      "error",
      {
        "ignorePropertyModificationsFor": ["draft"],
      },
    ],
    "no-sequences": "warn",
    "no-undef": "off",
    "no-var": "error",
    "prefer-const": ["warn", { "destructuring": "all" }],
    "prefer-template": "warn",
    "arrow-body-style": "off",
    "arrow-parens": "off",
    "block-spacing": "warn",
    "brace-style": ["warn", "stroustrup", { "allowSingleLine": true }],
    "comma-dangle": [1, "always-multiline"],
    "comma-spacing": ["warn", { "after": true }],
    "curly": ["error", "all"],
    "function-paren-newline": ["error", "consistent"],
    "generator-star-spacing": ["error", {
      "after": true,
      "before": false,
    }],
    "key-spacing": ["warn", { "afterColon": true }],
    "no-multiple-empty-lines": ["error", { "max": 2, "maxBOF": 2, "maxEOF": 0 }],
    "no-trailing-spaces": "warn",
    "object-curly-newline": ["error", {
      "consistent": true,
      "multiline": true,
    }],
    "object-curly-spacing": ["warn", "always", { "objectsInObjects": true }],
    "object-shorthand": "warn",
    "space-before-blocks": "warn",
    "space-infix-ops": ["warn", { "int32Hint": false }],
    "semi-spacing": ["warn", { "before": false, "after": true }],
  },
};
