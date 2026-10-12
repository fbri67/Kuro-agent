import { lstatSync, realpathSync } from 'node:fs';
import * as path from 'node:path';
import { containsShellOperators, detectRisk, isHighRiskDangerousCommand } from '../approval.js';
import { DEFAULT_CONFIG } from '../../types.js';

/** Host-supplied execution context, never taken from model approval flags. */
export interface ApprovalRequest {
  kind: 'exec' | 'start_process';
  cwd: string;
  /** Host workspace boundary; legacy callers use their execution cwd. */
  workspaceRoot?: string;
  command: string;
}

/** Exact command + operation + physical cwd grants; never persisted or prefix-matched. */
export class SessionApprovalAllowlist {
  private readonly entries = new Set<string>();

  private physicalPath(candidate: string, base = process.cwd()): string | null {
    const input = path.isAbsolute(candidate) ? candidate : `${path.resolve(base)}${path.sep}${candidate}`;
    const root = path.parse(input).root;
    if (!root) return null;
    let current = root;
    for (const segment of input.slice(root.length).split(/[\\/]+/)) {
      if (!segment || segment === '.') continue;
      if (segment === '..') {
        current = path.dirname(current);
        continue;
      }
      const next = path.join(current, segment);
      try {
        const stat = lstatSync(next);
        if (stat.isSymbolicLink()) {
          try {
            current = realpathSync.native(next);
          } catch {
            return null; // dangling link: never fall back to lexical containment
          }
          continue;
        }
        current = realpathSync.native(next);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') return null;
        current = next;
      }
    }
    return current;
  }

  /** Strip only unquoted, statically recognizable launcher prefixes. */
  private effectiveCommand(command: string): string | null {
    const parts = command.trim().split(/\s+/);
    let index = 0;
    const isAssignment = (value: string) => /^[A-Za-z_][A-Za-z0-9_]*=[^\s]*$/.test(value);
    const basename = (value: string) => value.split('/').pop()!.toLowerCase().replace(/\.exe$/i, '');
    while (index < parts.length) {
      while (index < parts.length && isAssignment(parts[index])) index += 1;
      if (index >= parts.length) break;
      const launcher = basename(parts[index]);
      if (launcher === 'nohup' || launcher === 'command' || launcher === 'exec' || launcher === 'setsid' || launcher === 'time' || launcher === 'daemonize') {
        index += 1;
        if (parts[index] === '--') index += 1;
        else if (parts[index]?.startsWith('-')) return null;
        continue;
      }
      if (launcher === 'nice') {
        index += 1;
        if (parts[index] === '-n' || parts[index] === '--adjustment') index += 2;
        else if (parts[index]?.startsWith('--adjustment=')) index += 1;
        else if (parts[index]?.startsWith('-') && /^-[0-9]+$/.test(parts[index])) index += 1;
        continue;
      }
      if (launcher === 'timeout') {
        index += 1;
        while (parts[index]?.startsWith('-')) {
          if (parts[index] === '-k' || parts[index] === '--kill-after' || parts[index] === '-s' || parts[index] === '--signal') index += 2;
          else if (parts[index].startsWith('--kill-after=') || parts[index].startsWith('--signal=')) index += 1;
          else return null;
        }
        if (!parts[index]) return null;
        index += 1; // duration
        continue;
      }
      if (launcher === 'stdbuf') {
        index += 1;
        while (parts[index]?.startsWith('-')) {
          if (['-i', '-o', '-e', '--input', '--output', '--error'].includes(parts[index])) index += 2;
          else return null;
        }
        continue;
      }
      if (launcher !== 'env') break;
      index += 1;
      while (index < parts.length) {
        const option = parts[index];
        if (option === '--') {
          index += 1;
          break;
        }
        if (option === '-i' || option === '--ignore-environment') {
          index += 1;
          continue;
        }
        if (option === '-u' || option === '--unset') {
          if (!parts[index + 1] || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(parts[index + 1])) return null;
          index += 2;
          continue;
        }
        if (option.startsWith('--unset=')) {
          index += 1;
          continue;
        }
        if (isAssignment(option)) {
          index += 1;
          continue;
        }
        if (option.startsWith('-')) return null;
        break;
      }
    }
    return index < parts.length ? parts.slice(index).join(' ') : null;
  }

  private commandPathsStayInWorkspace(command: string, cwd: string, workspaceRoot: string): boolean {
    const root = path.resolve(workspaceRoot);
    const physicalRoot = this.physicalPath(root);
    if (!physicalRoot) return false;
    const inside = (candidate: string): boolean => {
      const relative = path.relative(root, candidate);
      return relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
    };
    if (!inside(path.resolve(cwd))) return false;
    const physicalCwd = this.physicalPath(cwd);
    if (!physicalCwd) return false;
    const cwdRelative = path.relative(physicalRoot, physicalCwd);
    if (cwdRelative === '..' || cwdRelative.startsWith('..' + path.sep) || path.isAbsolute(cwdRelative)) return false;
    return command.split(/\s+/).every((part) => {
      // Inspect option values too (--file=../x), and normalize Windows
      // separators even on POSIX so foreign traversal cannot be remembered.
      const value = part.slice(part.indexOf('=') + 1).replace(/\\/g, '/');
      const candidate = value.replace(/^-[a-zA-Z]+(?=\/|\.{1,2}\/)/, '');
      // Shell-leading tilde forms expand before command execution; embedded
      // tildes (for example Windows 8.3 `RUNNER~1`) are ordinary path bytes.
      if (/^~(?:\/|$)|=~(?:\/|$)/.test(part)) return false;
      // A foreign drive path would otherwise look relative on POSIX.
      // Drive-relative paths also depend on ambient per-drive cwd on Windows.
      if (/^[a-zA-Z]:/.test(candidate) &&
        (process.platform !== 'win32' || !path.win32.isAbsolute(candidate))) return false;
      const resolved = path.isAbsolute(candidate) ? path.resolve(candidate) : path.resolve(cwd, candidate);
      if (!inside(resolved)) return false;
      const physicalInput = path.isAbsolute(candidate)
        ? candidate
        : `${physicalCwd}${path.sep}${candidate}`;
      const physical = this.physicalPath(physicalInput);
      if (!physical) return false;
      const relative = path.relative(physicalRoot, physical);
      return relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
    });
  }

  private isDirectGitPush(command: string): boolean {
    const parts = command.trim().split(/\s+/);
    if ((parts[0].split('/').pop() ?? '').replace(/\.exe$/i, '').toLowerCase() !== 'git') return false;
    let index = 1;
    while (index < parts.length && parts[index].startsWith('-')) {
      const option = parts[index++];
      if (['-C', '-c', '--git-dir', '--work-tree', '--namespace'].includes(option)) index += 1;
    }
    return parts[index]?.toLowerCase() === 'push';
  }

  private key(command: string, request?: ApprovalRequest): string | null {
    if (!request || !['exec', 'start_process'].includes(request.kind)) return null;
    const display = request.kind === 'start_process' ? `start_process ${request.command}` : request.command;
    if (command !== display) return null;
    const trimmed = request.command.trim();
    // Resolve from the host execution cwd against the host workspace boundary.
    // One-shot approvals remain separate; "always" must not authorize escapes.
    if (!this.commandPathsStayInWorkspace(trimmed, request.cwd, request.workspaceRoot ?? request.cwd)) return null;
    const effective = this.effectiveCommand(trimmed);
    if (!effective) return null;
    // Reject shell expansion, quoting, control characters and dynamic interpreters.
    // Complex commands remain available through one-shot approval, not "always".
    if (!trimmed || !/^[a-zA-Z0-9_./:@=,+~ -]+$/.test(trimmed) || containsShellOperators(command)) return null;
    const executable = effective.split(/\s+/)[0].split('/').pop()!.replace(/\.exe$/i, '').toLowerCase();
    if (/^(?:sudo|doas|su|env|sh|bash|dash|zsh|ksh|fish|cmd|powershell|pwsh|node|python[\d.]*|perl|ruby|lua|php|eval|xargs)$/.test(executable)) return null;
    const risk = detectRisk(effective, { ...DEFAULT_CONFIG, approvalEnabled: true, approvalAllowlist: [] }).risk;
    if (risk === 'blocked' || (request.kind === 'exec' && risk !== 'dangerous')) return null;
    if (isHighRiskDangerousCommand(effective).isHighRisk) return null;
    if (/\b(?:rm|rmdir|del|erase|rd|ri|remove-item|clear-content|remove-content|stop-computer|restart-computer|clear-eventlog|invoke-expression|iex)\b/i.test(effective)) return null;
    if (this.isDirectGitPush(effective)) return null;
    try {
      return JSON.stringify([
        request.kind, realpathSync(request.cwd),
        realpathSync(request.workspaceRoot ?? request.cwd), request.command,
      ]);
    } catch {
      return null; // unresolved execution context cannot carry a reusable grant
    }
  }

  canRemember(command: string, request?: ApprovalRequest): boolean {
    return this.key(command, request) !== null;
  }

  allows(command: string, request?: ApprovalRequest): boolean {
    const key = this.key(command, request);
    return key !== null && this.entries.has(key);
  }

  remember(command: string, request?: ApprovalRequest): boolean {
    const key = this.key(command, request);
    if (key === null) return false;
    this.entries.add(key);
    return true;
  }
}
