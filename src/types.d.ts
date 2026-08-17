declare module "world-atlas/*.json" {
  const value: unknown;
  export default value;
}

declare module "topojson-client" {
  export function feature(topology: unknown, object: unknown): unknown;
}
