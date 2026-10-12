/** Resolve a Kuro environment variable, falling back to its Ruko-era alias. */
export function getProductEnv(
  name: string,
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const current = `KURO_${name}`;
  if (env[current] !== undefined) return env[current];
  return env[`RUKO_${name}`];
}

/** Set the current Kuro environment variable. */
export function setProductEnv(name: string, value: string): void {
  process.env[`KURO_${name}`] = value;
}

/** Remove both Kuro and legacy Ruko forms of an environment variable. */
export function deleteProductEnv(name: string): void {
  delete process.env[`KURO_${name}`];
  delete process.env[`RUKO_${name}`];
}
