import path from "path";

export function dataFile(name: string, override: string | undefined) {
  if (override) return override;
  return path.join(process.cwd(), "data", name);
}
