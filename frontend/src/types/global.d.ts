// CSS module declarations for TypeScript 6.x compatibility
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
