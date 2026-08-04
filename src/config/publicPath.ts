const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function publicAsset(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalized}`;
}
