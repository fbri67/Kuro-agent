import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { validateSnapshotPath } from './undo.js';
import { productDataPath } from './productPaths.js';

const MAX_CHECKPOINT_BYTES = 64 * 1024 * 1024;
const MAX_CHECKPOINT_FILES = 500;
const MANIFEST_NAME = 'manifest.json';

type CheckpointEntry = {
  path: string;
  existed: boolean;
  mode: number;
  backup: string | null;
  size: number;
};

type Manifest = {
  version: 1;
  id: string;
  workspaceRoot: string;
  status: 'active' | 'rolling-back' | 'committed';
  entries: CheckpointEntry[];
};

/** Durable workspace-local transaction journal for automatic multi-file rollback. */
export class MutationCheckpoint {
  private readonly workspaceRoot: string;
  private readonly transactionDir: string;
  private readonly manifestPath: string;
  private manifest: Manifest | null = null;
  private totalBytes = 0;
  private readonly captured = new Set<string>();
  private finished = false;

  constructor(workspaceRoot: string, journalRoot = productDataPath(workspaceRoot, 'checkpoints')) {
    this.workspaceRoot = resolve(workspaceRoot);
    this.transactionDir = join(resolve(journalRoot), 'active');
    this.manifestPath = join(this.transactionDir, MANIFEST_NAME);
  }

  get hasMutations(): boolean {
    return !this.finished && (this.manifest?.entries.length ?? 0) > 0;
  }

  /** Persist the pre-mutation bytes before allowing any writer to touch a target. */
  async capture(targetPath: string): Promise<void> {
    if (this.finished) throw new Error('checkpoint sudah ditutup');
    const target = isAbsolute(targetPath) ? resolve(targetPath) : resolve(this.workspaceRoot, targetPath);
    this.validateTarget(target);
    await this.assertSafeTarget(target);
    const key = process.platform === 'win32' ? target.toLowerCase() : target;
    if (this.captured.has(key)) return;

    const manifest = await this.ensureActive();
    if (manifest.entries.length >= MAX_CHECKPOINT_FILES) {
      throw new Error(`batas checkpoint tercapai (${MAX_CHECKPOINT_FILES} file)`);
    }

    let existed = false;
    let mode = 0o644;
    let bytes = Buffer.alloc(0);
    try {
      const stat = await fs.lstat(target);
      if (!stat.isFile() || stat.isSymbolicLink()) {
        throw new Error(`target bukan file reguler: ${target}`);
      }
      if (stat.nlink > 1) throw new Error(`target memiliki hard link dan ditolak demi keamanan: ${target}`);
      existed = true;
      mode = stat.mode & 0o777;
      bytes = await fs.readFile(target);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') throw error;
    }

    if (this.totalBytes + bytes.length > MAX_CHECKPOINT_BYTES) {
      throw new Error(`batas ukuran checkpoint tercapai (${MAX_CHECKPOINT_BYTES} bytes)`);
    }

    const index = manifest.entries.length;
    const backup = existed ? `backup-${index}.bin` : null;
    if (backup) await this.writeAtomic(join(this.transactionDir, backup), bytes, 0o600);
    const entry: CheckpointEntry = {
      path: relative(this.workspaceRoot, target).split(sep).join('/'),
      existed,
      mode,
      backup,
      size: bytes.length,
    };
    manifest.entries.push(entry);
    this.totalBytes += bytes.length;
    this.captured.add(key);
    // Journal commit precedes the file mutation: a crash can only leave extra
    // backup data, never a mutation without a durable recovery record.
    await this.persist(manifest);
  }

  /** Restore all captured files in reverse order, retaining the journal on failure. */
  async rollback(): Promise<void> {
    if (this.finished) return;
    const manifest = this.manifest ?? await this.loadManifest();
    if (!manifest) {
      await fs.rm(this.transactionDir, { recursive: true, force: true });
      this.finished = true;
      return;
    }
    manifest.status = 'rolling-back';
    await this.persist(manifest);
    for (const entry of [...manifest.entries].reverse()) {
      await this.restoreEntry(entry);
    }
    await fs.rm(this.transactionDir, { recursive: true, force: true });
    this.finished = true;
  }

  /** Mark a successful batch committed before deleting its recoverable backups. */
  async commit(): Promise<void> {
    if (this.finished) return;
    const manifest = this.manifest ?? await this.loadManifest();
    if (!manifest) {
      this.finished = true;
      return;
    }
    manifest.status = 'committed';
    await this.persist(manifest);
    await fs.rm(this.transactionDir, { recursive: true, force: true });
    this.finished = true;
  }

  /** Recover an interrupted transaction before starting another workspace session. */
  static async recover(workspaceRoot: string, journalRoot = productDataPath(workspaceRoot, 'checkpoints')): Promise<boolean> {
    const checkpoint = new MutationCheckpoint(workspaceRoot, journalRoot);
    await checkpoint.assertSafeJournalRoot();
    let manifest: Manifest | null;
    try {
      manifest = await checkpoint.loadManifest();
    } catch (error) {
      throw new Error(`checkpoint pemulihan tidak valid; workspace tidak dimulai: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!manifest) {
      await fs.rm(checkpoint.transactionDir, { recursive: true, force: true });
      return false;
    }
    if (manifest.status === 'committed') {
      await fs.rm(checkpoint.transactionDir, { recursive: true, force: true });
      return false;
    }
    await checkpoint.rollback();
    return manifest.entries.length > 0;
  }

  private async ensureActive(): Promise<Manifest> {
    if (this.manifest) return this.manifest;
    await this.assertSafeJournalRoot();
    await fs.mkdir(this.transactionDir, { recursive: true, mode: 0o700 });
    await this.assertSafeJournalRoot();
    const existing = await this.loadManifest();
    if (existing) throw new Error('checkpoint aktif sebelumnya belum dipulihkan; workspace fail-closed');
    const manifest: Manifest = {
      version: 1,
      id: randomUUID(),
      workspaceRoot: this.workspaceRoot,
      status: 'active',
      entries: [],
    };
    this.manifest = manifest;
    await this.persist(manifest);
    return manifest;
  }

  private async loadManifest(): Promise<Manifest | null> {
    let raw: string;
    try {
      const stat = await fs.lstat(this.manifestPath);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 2 * 1024 * 1024) {
        throw new Error('manifest checkpoint bukan file reguler atau terlalu besar');
      }
      raw = await fs.readFile(this.manifestPath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
    const value: unknown = JSON.parse(raw);
    if (!isManifest(value)) throw new Error('skema manifest checkpoint tidak valid');
    if (resolve(value.workspaceRoot) !== this.workspaceRoot) throw new Error('workspace manifest checkpoint tidak cocok');
    this.manifest = value;
    this.totalBytes = value.entries.reduce((sum, entry) => sum + entry.size, 0);
    if (this.totalBytes > MAX_CHECKPOINT_BYTES || value.entries.length > MAX_CHECKPOINT_FILES) {
      throw new Error('batas ukuran/jumlah file manifest checkpoint terlampaui');
    }
    for (const entry of value.entries) {
      const target = resolve(this.workspaceRoot, entry.path);
      if (relative(this.workspaceRoot, target).startsWith('..') || isAbsolute(relative(this.workspaceRoot, target))) {
        throw new Error(`target manifest keluar dari workspace: ${entry.path}`);
      }
      this.validateTarget(target);
      if (entry.existed) {
        if (entry.backup !== `backup-${value.entries.indexOf(entry)}.bin`) throw new Error('nama backup checkpoint tidak valid');
        const backupStat = await fs.lstat(join(this.transactionDir, entry.backup));
        if (!backupStat.isFile() || backupStat.isSymbolicLink() || backupStat.nlink > 1 || backupStat.size !== entry.size) {
          throw new Error(`backup checkpoint rusak: ${entry.backup}`);
        }
      } else if (entry.backup !== null || entry.size !== 0) {
        throw new Error('entri file baru checkpoint tidak valid');
      }
    }
    return value;
  }

  private async persist(manifest: Manifest): Promise<void> {
    const raw = `${JSON.stringify(manifest)}\n`;
    await this.writeAtomic(this.manifestPath, Buffer.from(raw, 'utf8'), 0o600);
  }

  private async restoreEntry(entry: CheckpointEntry): Promise<void> {
    const target = resolve(this.workspaceRoot, entry.path);
    this.validateTarget(target);
    await this.assertSafeTarget(target);
    if (!entry.existed) {
      try {
        const stat = await fs.lstat(target);
        if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`pemulihan menolak target non-file: ${target}`);
        await fs.unlink(target);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
      return;
    }
    if (!entry.backup) throw new Error(`backup checkpoint hilang untuk ${entry.path}`);
    const bytes = await fs.readFile(join(this.transactionDir, entry.backup));
    if (bytes.length !== entry.size) throw new Error(`ukuran backup checkpoint berubah untuk ${entry.path}`);
    await fs.mkdir(dirname(target), { recursive: true });
    await this.assertSafeTarget(target);
    await this.writeAtomic(target, bytes, entry.mode);
  }

  private async assertSafeTarget(target: string): Promise<void> {
    this.validateTarget(target);
    const rel = relative(this.workspaceRoot, target);
    let current = this.workspaceRoot;
    for (const segment of rel.split(sep).filter(Boolean)) {
      current = join(current, segment);
      try {
        const stat = await fs.lstat(current);
        if (stat.isSymbolicLink()) throw new Error(`checkpoint menolak symbolic link: ${current}`);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
    }
  }

  /** The remember tool is the sole approved writer for this protected file. */
  private validateTarget(target: string): void {
    const rel = relative(this.workspaceRoot, target).split(sep).join('/').toLowerCase();
    if (rel === '.kuro/memory.md' || rel === '.ruko/memory.md') return;
    validateSnapshotPath(target, this.workspaceRoot);
  }

  private async assertSafeJournalRoot(): Promise<void> {
    const relativeJournal = relative(this.workspaceRoot, this.transactionDir);
    if (relativeJournal.startsWith('..') || isAbsolute(relativeJournal)) {
      throw new Error('direktori checkpoint berada di luar workspace');
    }
    let current = this.workspaceRoot;
    for (const segment of relativeJournal.split(sep).filter(Boolean)) {
      current = join(current, segment);
      try {
        const stat = await fs.lstat(current);
        if (stat.isSymbolicLink()) throw new Error(`direktori checkpoint menolak symbolic link: ${current}`);
        if (!stat.isDirectory()) throw new Error(`direktori checkpoint bukan direktori: ${current}`);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
    }
  }

  private async writeAtomic(target: string, bytes: Uint8Array, mode: number): Promise<void> {
    const tempPath = `${target}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(tempPath, bytes, { mode, flag: 'wx' });
      await fs.rename(tempPath, target);
    } catch (error) {
      await fs.rm(tempPath, { force: true }).catch(() => {});
      throw error;
    }
  }
}

function isManifest(value: unknown): value is Manifest {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Manifest>;
  if (candidate.version !== 1 || typeof candidate.id !== 'string' || typeof candidate.workspaceRoot !== 'string') return false;
  if (candidate.status !== 'active' && candidate.status !== 'rolling-back' && candidate.status !== 'committed') return false;
  if (!Array.isArray(candidate.entries)) return false;
  return candidate.entries.every((entry): entry is CheckpointEntry =>
    Boolean(entry) &&
    typeof entry.path === 'string' &&
    !entry.path.includes('\\') &&
    !entry.path.split('/').includes('..') &&
    typeof entry.existed === 'boolean' &&
    Number.isInteger(entry.mode) && entry.mode >= 0 && entry.mode <= 0o777 &&
    (entry.backup === null || typeof entry.backup === 'string') &&
    Number.isSafeInteger(entry.size) && entry.size >= 0,
  );
}
