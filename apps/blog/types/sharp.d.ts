// sharp's package.json "exports" field omits a "types" entry, so TypeScript
// with moduleResolution "bundler" cannot find the declarations automatically.
// This shim re-exports the hand-written types that ship in sharp/lib/index.d.ts.
declare module "sharp" {
  export * from "../node_modules/sharp/lib/index.d.ts";
  export { default } from "../node_modules/sharp/lib/index.d.ts";
}
