/**
 * @fileoverview Mirror bundler config to allow importing
 * files as plain text from TypeScript.
 */

declare module '*.txt' {
  const text: string;
  export default text;
}

declare module '*.md' {
  const text: string;
  export default text;
}

declare module '*.graphql' {
  const text: string;
  export default text;
}

declare module '*.css' {
  const css: string;
  export default css;
}
