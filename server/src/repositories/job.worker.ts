import { Kysely, sql } from 'kysely';
import { JobName, QueueName } from 'src/enum';
import { DB } from 'src/schema';
import { JobItem } from 'src/types';

// Job status codes stored as "char" (single-byte PostgreSQL type)
const STATUS_PENDING = 'p';
const STATUS_ACTIVE = 'a';
const STATUS_FAILED = 'f';

// Bidirectional JobName <-> "char" mapping
const JOB_CHAR: Record<string, string> = {};
const CHAR_JOB: Record<string, JobName> = {};

// Assign sequential character codes starting from 0x01
let charCode = 1;
for (const jobName of Object.values(JobName)) {
  const char = String.fromCodePoint(charCode++);
  JOB_CHAR[jobName] = char;
  CHAR_JOB[char] = jobName;
}

export const jobNameToChar = (name: JobName): string => JOB_CHAR[name];
export const charToJobName = (char: string): JobName | undefined => CHAR_JOB[char];

type JobRow = {
  id: number;
  name: string;
  data: unknown;
  priority: number;
  status: string;
  dedup_key: string | null;
  run_after: Date;
  started_at: Date | null;
  expires_at: Date | null;
  error: string | null;
};

export interface QueueWorkerOptions {
  queueName: QueueName;
  tableName: string;
  stallTimeout: number;
  claimBatch: number;
  concurrency: number;
  db: Kysely<DB>;
  onJob: (job: JobItem) => Promise<void>;
}

export class QueueWorker {
  private concurrency: number;
  private activeCount = 0;
  private activeJobs = new Map<number, { startedAt: number }>();
  private hasPending = true;
  private fetching = false;
  private paused = false;
  private stopped = false;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  private readonly queueName: QueueName;
  private readonly tableName: string;
  private readonly stallTimeout: number;
  private readonly claimBatch: number;
  private readonly db: Kysely<DB>;
  private readonly onJobFn: (job: JobItem) => Promise<void>;

  constructor(options: QueueWorkerOptions) {
    this.queueName = options.queueName;
    this.tableName = options.tableName;
    this.stallTimeout = options.stallTimeout;
    this.claimBatch = options.claimBatch;
    this.concurrency = options.concurrency;
    this.db = options.db;
    this.onJobFn = options.onJob;
  }

  get activeJobCount(): number {
    return this.activeCount;
  }

  onNotification(): void {
    this.hasPending = true;
    void this.tryFetch();
  }

  setConcurrency(n: number): void {
    this.concurrency = n;
    void this.tryFetch();
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
    this.hasPending = true;
    void this.tryFetch();
  }

  async shutdown(): Promise<void> {
    this.stopped = true;
    this.stopHeartbeat();

    // Re-queue active jobs
    if (this.activeJobs.size > 0) {
      const ids = [...this.activeJobs.keys()];
      await sql`
        UPDATE ${sql.table(this.tableName)}
        SET "status" = ${STATUS_PENDING}::"char", "started_at" = NULL, "expires_at" = NULL
        WHERE "id" = ANY(${sql.val(ids)}::bigint[])
      `.execute(this.db);
    }
  }

  private get slotsAvailable(): number {
    return Math.max(0, this.concurrency - this.activeCount);
  }

  private async tryFetch(): Promise<void> {
    if (this.fetching || this.paused || this.stopped) {
      return;
    }
    this.fetching = true;
    try {
      while (this.slotsAvailable > 0 && this.hasPending && !this.stopped) {
        const limit = Math.min(this.slotsAvailable, this.claimBatch);
        const jobs = await this.claim(limit);
        if (jobs.length === 0) {
          const recovered = await this.recoverStalled();
          if (recovered === 0) {
            this.hasPending = false;
            break;
          }
          continue;
        }
        this.activeCount += jobs.length;
        for (const job of jobs) {
          void this.processJob(job);
        }
      }
    } finally {
      this.fetching = false;
    }
  }

  private async processJob(row: JobRow): Promise<void> {
    this.activeJobs.set(row.id, { startedAt: Date.now() });
    this.startHeartbeat();
    try {
      const jobName = charToJobName(row.name);
      if (!jobName) {
        throw new Error(`Unknown job char code: ${row.name.codePointAt(0)}`);
      }
      await this.onJobFn({ name: jobName, data: row.data } as JobItem);
      // Success: delete completed job and try to fetch next
      const next = await this.completeAndFetch(row.id, true);
      this.activeJobs.delete(row.id);
      if (next) {
        void this.processJob(next);
      } else {
        this.activeCount--;
        this.hasPending = false;
      }
    } catch (error: unknown) {
      // Failure: mark as failed and try to fetch next
      const errorMsg = error instanceof Error ? error.message : String(error);
      const next = await this.completeAndFetch(row.id, false, errorMsg);
      this.activeJobs.delete(row.id);
      if (next) {
        void this.processJob(next);
      } else {
        this.activeCount--;
        this.hasPending = false;
      }
    } finally {
      if (this.activeJobs.size === 0) {
        this.stopHeartbeat();
      }
    }
  }

  /**
   * Claim up to `limit` pending jobs using FOR UPDATE SKIP LOCKED
   */
  private async claim(limit: number): Promise<JobRow[]> {
    const result = await sql<JobRow>`
      UPDATE ${sql.table(this.tableName)} SET
        "status" = ${STATUS_ACTIVE}::"char",
        "started_at" = now(),
        "expires_at" = now() + ${sql.lit(`'${this.stallTimeout} milliseconds'`)}::interval
      WHERE "id" IN (
        SELECT "id" FROM ${sql.table(this.tableName)}
        WHERE "status" = ${STATUS_PENDING}::"char" AND "run_after" <= now()
        ORDER BY "priority" DESC, "id" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${sql.lit(limit)}
      )
      RETURNING *
    `.execute(this.db);
    return result.rows as JobRow[];
  }

  /**
   * Atomically complete a job (delete on success, mark failed on failure) and claim the next one.
   * Uses a CTE to combine operations in a single round-trip.
   */
  private async completeAndFetch(
    jobId: number,
    success: boolean,
    errorMsg?: string,
  ): Promise<JobRow | undefined> {
    if (success) {
      const result = await sql<JobRow>`
        WITH completed AS (
          DELETE FROM ${sql.table(this.tableName)} WHERE "id" = ${jobId}
        ),
        next AS (
          SELECT "id" FROM ${sql.table(this.tableName)}
          WHERE "status" = ${STATUS_PENDING}::"char" AND "run_after" <= now()
          ORDER BY "priority" DESC, "id" ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        )
        UPDATE ${sql.table(this.tableName)} SET
          "status" = ${STATUS_ACTIVE}::"char",
          "started_at" = now(),
          "expires_at" = now() + ${sql.lit(`'${this.stallTimeout} milliseconds'`)}::interval
        WHERE "id" = (SELECT "id" FROM next)
        RETURNING *
      `.execute(this.db);
      return (result.rows as JobRow[])[0];
    }

    const result = await sql<JobRow>`
      WITH failed AS (
        UPDATE ${sql.table(this.tableName)}
        SET "status" = ${STATUS_FAILED}::"char", "error" = ${errorMsg ?? null}
        WHERE "id" = ${jobId}
      ),
      next AS (
        SELECT "id" FROM ${sql.table(this.tableName)}
        WHERE "status" = ${STATUS_PENDING}::"char" AND "run_after" <= now()
        ORDER BY "priority" DESC, "id" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE ${sql.table(this.tableName)} SET
        "status" = ${STATUS_ACTIVE}::"char",
        "started_at" = now(),
        "expires_at" = now() + ${sql.lit(`'${this.stallTimeout} milliseconds'`)}::interval
      WHERE "id" = (SELECT "id" FROM next)
      RETURNING *
    `.execute(this.db);
    return (result.rows as JobRow[])[0];
  }

  /**
   * Recover stalled jobs: reset jobs whose expires_at has passed
   */
  private async recoverStalled(): Promise<number> {
    const result = await sql`
      UPDATE ${sql.table(this.tableName)}
      SET "status" = ${STATUS_PENDING}::"char", "started_at" = NULL, "expires_at" = NULL
      WHERE "status" = ${STATUS_ACTIVE}::"char" AND "expires_at" < now()
    `.execute(this.db);
    return Number(result.numAffectedRows ?? 0);
  }

  /**
   * Extend expiry for all active jobs (heartbeat)
   */
  private async extendExpiry(): Promise<void> {
    if (this.activeJobs.size === 0) {
      return;
    }
    const ids = [...this.activeJobs.keys()];
    await sql`
      UPDATE ${sql.table(this.tableName)}
      SET "expires_at" = now() + ${sql.lit(`'${this.stallTimeout} milliseconds'`)}::interval
      WHERE "id" = ANY(${sql.val(ids)}::bigint[])
    `.execute(this.db);
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      return;
    }
    const interval = Math.max(1000, Math.floor(this.stallTimeout / 2));
    this.heartbeatTimer = setInterval(() => void this.extendExpiry(), interval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
