# JSX Engine with Reactive Tools

JSX Engine is an small toolset that leverages TypeScript's `jsxFactory` compiler option. It extends the default ts compiler output to enhance reactivity, making the output more dynamic and responsive. This is achieved by enabling props as getters and transforming children into functions.

# Usage

1. Import JSX types in your `tsconfig.json`

```json
{
  "extends": "jsx/tsconfig.json",
  ...
}
```
