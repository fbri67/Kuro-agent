import { parse } from '@babel/parser';
import { promises as fs } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs']);
const DEFAULT_MAX_FILES = 1_500;
const DEFAULT_MAX_OUTPUT_CHARS = 12_000;
const MAX_SOURCE_BYTES = 1_500_000;
const IGNORED_DIRECTORIES = new Set(['.git', '.ruko', '.kuro', 'node_modules', 'dist', 'build', 'coverage', '.next', '.cache', 'vendor']);

type AstNode = {
  type: string;
  program?: AstNode;
  start?: number;
  loc?: { start?: { line?: number } };
  body?: AstNode[];
  declaration?: AstNode | null;
  declarations?: AstNode[];
  id?: AstNode | null;
  name?: string;
  kind?: string;
  source?: { value?: unknown } | null;
  value?: unknown;
  [key: string]: unknown;
};

type ModuleInfo = {
  relPath: string;
  symbols: string[];
  imports: string[];
  parseFailed: boolean;
};

export interface RepoMapOptions {
  maxFiles?: number;
  maxOutputChars?: number;
}

/** Build a compact, bounded JS/TS symbol map with AST-derived local import edges. */
export async function generateRepoMap(
  workspaceRoot = process.cwd(),
  options: RepoMapOptions = {},
): Promise<string> {
  const root = resolve(workspaceRoot);
  const maxFiles = clampInt(options.maxFiles, 1, 10_000, DEFAULT_MAX_FILES);
  const maxOutputChars = clampInt(options.maxOutputChars, 500, 100_000, DEFAULT_MAX_OUTPUT_CHARS);
  const entries = (await listCodeFiles(root)).sort((a, b) => a.relPath.localeCompare(b.relPath));
  const selected = entries.slice(0, maxFiles);
  const infos: ModuleInfo[] = [];
  const byPath = new Map<string, ModuleInfo>();

  for (const entry of selected) {
    const relPath = entry.relPath.replace(/\\/g, '/');
    try {
      const stat = await fs.lstat(entry.absPath);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_SOURCE_BYTES) continue;
      const source = await fs.readFile(entry.absPath, 'utf8');
      const info = inspectModule(relPath, source);
      infos.push(info);
      byPath.set(relPath, info);
    } catch {
      // Permission errors, binary input, and files changed during traversal are skipped.
    }
  }

  const lines = [`# Repo Map (${infos.length}/${entries.length} JS/TS files)`];
  if (entries.length > selected.length) {
    lines.push(`(inventory capped at ${maxFiles} files; narrow the workspace for a complete map)`);
  }
  lines.push('');

  for (const info of infos) {
    const edges = info.imports
      .map((spec) => resolveLocalImport(info.relPath, spec, byPath))
      .filter((target): target is string => target !== null);
    const symbolText = info.symbols.length ? info.symbols.join(', ') : (info.parseFailed ? 'syntax unavailable' : '—');
    const edgeText = edges.length ? ` → ${[...new Set(edges)].join(', ')}` : '';
    const line = `- ${info.relPath}: ${symbolText}${edgeText}`;
    if (lines.join('\n').length + line.length + 1 > maxOutputChars) {
      lines.push(`… output capped at ${maxOutputChars} chars; narrow the workspace or increase the limit …`);
      break;
    }
    lines.push(line);
  }

  return lines.join('\n');
}

function inspectModule(relPath: string, source: string): ModuleInfo {
  try {
    const ast = parse(source, {
      sourceType: 'unambiguous',
      errorRecovery: true,
      plugins: ['typescript', 'jsx', 'decorators-legacy'],
    }) as unknown as AstNode;
    const program = ast.program ?? ast;
    const symbols: string[] = [];
    const imports: string[] = [];
    for (const statement of program.body ?? []) {
      const declaration = statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
        ? statement.declaration
        : statement;
      if (statement.type === 'ImportDeclaration' || statement.type === 'ExportAllDeclaration' || statement.type === 'ExportNamedDeclaration') {
        const spec = statement.source?.value;
        if (typeof spec === 'string') imports.push(spec);
      }
      if (declaration) collectTopLevelSymbols(declaration, symbols);
    }
    collectDynamicImports(program, imports);
    const errors: unknown = ast.errors;
    return { relPath, symbols: [...new Set(symbols)].slice(0, 12), imports: [...new Set(imports)], parseFailed: Array.isArray(errors) && errors.length > 0 };
  } catch {
    return { relPath, symbols: [], imports: [], parseFailed: true };
  }
}

function collectTopLevelSymbols(node: AstNode, out: string[]): void {
  if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration' || node.type === 'TSInterfaceDeclaration' || node.type === 'TSTypeAliasDeclaration' || node.type === 'TSEnumDeclaration' || node.type === 'EnumDeclaration') {
    if (node.id && typeof node.id.name === 'string') out.push(`${node.id.name}${node.type.includes('Function') ? '()' : ''}`);
    return;
  }
  if (node.type !== 'VariableDeclaration') return;
  for (const declaration of node.declarations ?? []) {
    const id = declaration.id;
    if (id && id.type === 'Identifier' && typeof id.name === 'string') {
      out.push(`${id.name}${declaration.init && isFunctionExpression(declaration.init) ? '()' : ''}`);
    }
  }
}

function isFunctionExpression(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const type = (value as AstNode).type;
  return type === 'ArrowFunctionExpression' || type === 'FunctionExpression';
}

function collectDynamicImports(root: AstNode, imports: string[]): void {
  const stack: unknown[] = [root];
  const visited = new Set<object>();
  while (stack.length) {
    const value = stack.pop();
    if (!value || typeof value !== 'object') continue;
    if (visited.has(value)) continue;
    visited.add(value);
    if (Array.isArray(value)) {
      stack.push(...value);
      continue;
    }
    const node = value as AstNode;
    if (node.type === 'ImportExpression' && node.source && typeof node.source === 'object') {
      const source = node.source as AstNode;
      if (source.type === 'StringLiteral' && typeof source.value === 'string') imports.push(source.value);
    }
    for (const [key, child] of Object.entries(node)) {
      if (key === 'loc' || key === 'tokens' || key === 'comments' || key === 'errors') continue;
      if (child && typeof child === 'object') stack.push(child);
    }
  }
}

function resolveLocalImport(fromPath: string, specifier: string, files: Map<string, ModuleInfo>): string | null {
  if (!specifier.startsWith('.')) return null;
  const base = resolve('/', dirname(fromPath), specifier).slice(1).replace(/\\/g, '/');
  const ext = extname(base).toLowerCase();
  const candidates = ext === '.js' || ext === '.jsx' || ext === '.mjs' || ext === '.cjs'
    ? [`${base.slice(0, -ext.length)}.ts`, `${base.slice(0, -ext.length)}.tsx`, `${base.slice(0, -ext.length)}.mts`, base]
    : ext
      ? [base]
      : [base, ...[...CODE_EXTENSIONS].map((suffix) => `${base}${suffix}`), ...[...CODE_EXTENSIONS].map((suffix) => join(base, `index${suffix}`).replace(/\\/g, '/'))];
  for (const candidate of candidates) {
    const normalized = candidate.split('/').filter((part) => part && part !== '.').join('/');
    if (files.has(normalized)) return normalized;
  }
  return null;
}

function clampInt(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

async function listCodeFiles(root: string): Promise<Array<{ relPath: string; absPath: string }>> {
  const found: Array<{ relPath: string; absPath: string }> = [];
  const pending = [root];
  while (pending.length > 0 && found.length < 10_000) {
    const directory = pending.pop();
    if (!directory) continue;
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      continue;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const absPath = join(directory, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) pending.push(absPath);
        continue;
      }
      if (!entry.isFile() || !CODE_EXTENSIONS.has(extname(entry.name).toLowerCase())) continue;
      const lower = entry.name.toLowerCase();
      if (lower.startsWith('.env') || lower.endsWith('.pem') || lower.endsWith('.key') || lower === 'id_rsa' || lower === 'id_ed25519' || lower.startsWith('.git-credentials')) continue;
      found.push({ relPath: relative(root, absPath).split(sep).join('/'), absPath });
      if (found.length >= 10_000) break;
    }
  }
  return found;
}
