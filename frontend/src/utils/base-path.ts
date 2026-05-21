const appBase = import.meta.env.BASE_URL || '/';

export const basePath = appBase.endsWith('/') ? appBase : `${appBase}/`;

export const apiBase = import.meta.env.VITE_API_BASE || `${basePath}api`;

export function withBasePath(path: string): string {
  if (!path || path.startsWith('http')) return path;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${basePath}${normalizedPath}`;
}
