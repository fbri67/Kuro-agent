/** Myers line diff with git-style colored rendering for file mutations. */
import { diffArrays } from 'diff';
import { dim, green, red } from './ui.js';

export type DiffOpType = 'eq' | 'add' | 'del';

export interface DiffOp {
  type: DiffOpType;
  line: string;
}

/** Max middle-section size handled by the exact LCS DP (prefix/suffix trimmed). */
const LCS_CELL_LIMIT = 400 * 400;

/** Splits text into lines, dropping the artifact empty line of a trailing \n. */
export function splitLines(text: string): string[] {
  if (text === '') return [];
  const lines = text.split('\n');
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/** Line-level diff between two arrays of lines. */
export function diffLines(oldLines: string[], newLines: string[]): DiffOp[] {
  const changes = diffArrays(oldLines, newLines, {
    maxEditLength: 20_000,
    timeout: 2_000,
  });
  if (changes) {
    return changes.flatMap((change): DiffOp[] =>
      change.value.map((line): DiffOp => ({
        type: change.added ? 'add' : change.removed ? 'del' : 'eq',
        line,
      })),
    );
  }

  // Guarded fallback remains exact in content even when a very large change
  // reaches the work/time cap; avoid an unbounded quadratic allocation.
  return [
    ...oldLines.map((line): DiffOp => ({ type: 'del', line })),
    ...newLines.map((line): DiffOp => ({ type: 'add', line })),
  ];
}

export interface RenderDiffOptions {
  /** Unchanged context lines kept around each hunk. */
  context?: number;
  /** Hard cap on rendered lines. */
  maxLines?: number;
  /** Compact mode: only delta lines (+/-), no unchanged context lines or boilerplate. */
  compact?: boolean;
}

/**
 * Git-style rendered diff: removed lines red with `-`, added lines green
 * with `+`, unchanged lines dim. Long unchanged stretches are collapsed.
 */
export function renderFileDiff(
  pathLabel: string,
  oldText: string,
  newText: string,
  opts: RenderDiffOptions = {},
): string {
  const maxLines = opts.maxLines ?? 160;
  const oldLines = splitLines(oldText);
  const newLines = splitLines(newText);
  const ops = diffLines(oldLines, newLines);

  // Item 5: Compact mode displays only delta changes (+/-) without boilerplate lines
  if (opts.compact) {
    const out: string[] = [];
    for (const op of ops) {
      if (op.type === 'del') out.push(red(`- ${op.line}`));
      else if (op.type === 'add') out.push(green(`+ ${op.line}`));
    }
    if (out.length === 0) return dim('  (tidak ada perubahan baris)');
    if (out.length > maxLines) {
      return [...out.slice(0, maxLines), dim('  … (diff dipotong) …')].join('\n');
    }
    return out.join('\n');
  }

  const context = opts.context ?? 3;
  // Mark which eq lines are kept (within `context` of a change).
  const keep = new Array<boolean>(ops.length).fill(false);
  let lastChange = -Infinity;
  for (let i = 0; i < ops.length; i += 1) {
    if (ops[i].type !== 'eq') {
      for (let k = Math.max(0, i - context); k <= i; k += 1) keep[k] = true;
      lastChange = i;
    } else if (i - lastChange <= context) {
      keep[i] = true;
    }
  }

  const out: string[] = [];
  out.push(dim(`  diff ${pathLabel}`));
  let skipped = 0;
  for (let i = 0; i < ops.length; i += 1) {
    const op = ops[i];
    if (op.type === 'eq' && !keep[i]) {
      skipped += 1;
      continue;
    }
    if (skipped > 0) {
      out.push(dim(`  … ${skipped} baris tidak berubah …`));
      skipped = 0;
    }
    if (op.type === 'del') out.push(red(`- ${op.line}`));
    else if (op.type === 'add') out.push(green(`+ ${op.line}`));
    else out.push(dim(`  ${op.line}`));
  }
  if (skipped > 0) out.push(dim(`  … ${skipped} baris tidak berubah …`));
  if (out.length === 1) out.push(dim('  (tidak ada perubahan baris)'));
  if (out.length > maxLines) {
    return [...out.slice(0, maxLines), dim('  … (diff dipotong) …')].join('\n');
  }
  return out.join('\n');
}
