import { existsSync, lstatSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** Each current or legacy data root needs its own public-path exception. */
export function isSensitiveProductDataPath(candidate: string): boolean {
  const segments = candidate.replace(/\\/g, '/').toLowerCase().split('/');
  for (let index = 0; index < segments.length; index += 1) {
    if (segments[index] !== '.kuro' && segments[index] !== '.ruko') continue;
    if (segments[index + 1] === 'skills') continue;
    if (segments[index + 1] === 'plan.json' && index + 2 === segments.length) continue;
    return true;
  }
  return false;
}

/** A data root must be a real directory; dangling links must not look absent. */
function dataRootExists(root: string): boolean {
  try {
    const stat = lstatSync(root);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error(`direktori data "${root}" tidak aman: symbolic link atau bukan direktori.`);
    }
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

/** Resolve Kuro storage while keeping existing Ruko data in place. */
export function productDataDir(basePath: string): string {
  const base = resolve(basePath);
  const kuroDir = join(base, '.kuro');
  if (dataRootExists(kuroDir)) return kuroDir;

  const legacyDir = join(base, '.ruko');
  if (dataRootExists(legacyDir)) return legacyDir;

  return kuroDir;
}

/** Prefer an existing Kuro path, then retain the matching legacy path in place. */
export function productDataPath(basePath: string, ...segments: string[]): string {
  const base = resolve(basePath);
  const hasKuroDir = dataRootExists(join(base, '.kuro'));
  const kuroPath = join(base, '.kuro', ...segments);
  if (hasKuroDir && existsSync(kuroPath)) return kuroPath;

  const hasLegacyDir = dataRootExists(join(base, '.ruko'));
  const rukoPath = join(base, '.ruko', ...segments);
  if (hasLegacyDir && existsSync(rukoPath)) return rukoPath;

  return join(productDataDir(base), ...segments);
}
