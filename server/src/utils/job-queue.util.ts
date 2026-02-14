import { Kysely, Selectable, sql } from 'kysely';
import postgres from 'postgres';
import { JOB_CODE_TO_NAME, JobCode, JobQueueStatus, QueueName } from 'src/enum';
import { DB } from 'src/schema';
import { JobTable } from 'src/schema/tables/job.table';
import { JobItem } from 'src/types';

const csvEscape = (s: string) => '"' + s.replace(/"/g, '""') + '"';

export type InsertRow = {
  code: JobCode;
  data: unknown;
  priority: number | null;
  dedupKey: string | null;
  runAfter: Date | null;
};

export const getTable = (db: Kysely<DB>, queueName: QueueName) => db.dynamic.table(QUEUE_TABLE[queueName]).as('t');

export class QueueWorker {
  activeJobCount = 0;
  private concurrency: number;
  private activeJobs = new Map<number, { startedAt: number }>();
  private hasPending = true;
  private fetching = false;
  private paused = false;
  private stopped = false;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private sweepTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly table: ReturnType<typeof getTable>;
  private readonly stallTimeout: number;
  private readonly claimBatch: number;
  private readonly db: Kysely<DB>;
  private readonly onJobFn: (job: JobItem) => Promise<unknown>;

  constructor(options: QueueWorkerOptions) {
    this.stallTimeout = options.stallTimeout;
    this.claimBatch = options.claimBatch;
    this.concurrency = options.concurrency;
    this.db = options.db;
    this.table = getTable(this.db, options.queueName);
    this.onJobFn = options.onJob;

    // One-shot sweep after stallTimeout to recover jobs orphaned by a crash
    // that restarted before their expiry passed
    this.sweepTimer = setTimeout(() => this.onNotification(), this.stallTimeout);
  }

  onNotification() {
    this.hasPending = true;
    void this.tryFetch();
  }

  setConcurrency(n: number) {
    this.concurrency = n;
    void this.tryFetch();
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.hasPending = true;
    void this.tryFetch();
  }

  shutdown() {
    this.stopped = true;
    this.stopHeartbeat();
    if (this.sweepTimer) {
      clearTimeout(this.sweepTimer);
      this.sweepTimer = null;
    }

    if (this.activeJobs.size === 0) {
      return Promise.resolve();
    }

    // Re-queue active jobs
    const ids = [...this.activeJobs.keys()];
    return this.db
      .updateTable(this.table)
      .set({
        status: JobQueueStatus.Pending,
        startedAt: null,
        expiresAt: null,
      })
      .where('id', 'in', ids)
      .execute();
  }

  private get slotsAvailable() {
    return Math.max(0, this.concurrency - this.activeJobCount);
  }

  private async tryFetch() {
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
          if (recovered.numChangedRows === 0n) {
            this.hasPending = false;
            break;
          }
          continue;
        }
        this.activeJobCount += jobs.length;
        for (const job of jobs) {
          void this.processJob(job);
        }
      }
    } finally {
      this.fetching = false;
    }
  }

  private async processJob(row: Selectable<JobTable>) {
    this.activeJobs.set(row.id, { startedAt: Date.now() });
    this.startHeartbeat();
    try {
      const jobName = JOB_CODE_TO_NAME[row.code];
      if (!jobName) {
        throw new Error(`Unknown job char code: ${row.code}`);
      }
      await this.onJobFn({ name: jobName, data: row.data } as JobItem);
      // Success: delete completed job and try to fetch next
      const next = this.stopped ? undefined : await this.completeAndFetch(row.id, true).catch(() => undefined);
      this.activeJobs.delete(row.id);
      if (next) {
        void this.processJob(next);
      } else {
        this.activeJobCount--;
        this.hasPending = false;
      }
    } catch (error: unknown) {
      // Failure: mark as failed and try to fetch next
      const errorMsg = error instanceof Error ? error.message : String(error);
      const next = await this.completeAndFetch(row.id, false, errorMsg).catch(() => undefined);
      this.activeJobs.delete(row.id);
      if (next) {
        void this.processJob(next);
      } else {
        this.activeJobCount--;
        this.hasPending = false;
      }
    } finally {
      if (this.activeJobs.size === 0) {
        this.stopHeartbeat();
      }
    }
  }

  /**
   * Claim up to `limit` pending jobs.
   * Uses a materialized CTE with FOR NO KEY UPDATE SKIP LOCKED
   * to avoid race conditions and excessive locking.
   */
  private claim(limit: number) {
    return this.db
      .with(
        (wb) => wb('candidates').materialized(),
        (qb) =>
          qb
            .selectFrom(this.table)
            .select('id')
            .where('status', '=', JobQueueStatus.Pending)
            .where('runAfter', '<=', sql<Date>`now()`)
            .orderBy('priority', 'desc')
            .orderBy('id', 'asc')
            .limit(limit)
            .forNoKeyUpdate()
            .skipLocked(),
      )
      .updateTable(this.table)
      .set({
        status: JobQueueStatus.Active,
        startedAt: sql<Date>`now()`,
        expiresAt: sql<Date>`now() + ${sql.lit(`'${this.stallTimeout} milliseconds'`)}::interval`,
      })
      .where((eb) => eb('id', 'in', eb.selectFrom('candidates').select('id')))
      .returningAll()
      .execute();
  }

  /**
   * Atomically complete a job (delete on success, mark failed on failure) and claim the next one.
   * Uses a CTE to combine operations in a single round-trip.
   */
  private completeAndFetch(jobId: number, success: boolean, errorMsg?: string) {
    const query = this.db.with('mark', (qb) =>
      success
        ? qb.deleteFrom(this.table).where('id', '=', jobId)
        : qb
            .updateTable(this.table)
            .set({ status: JobQueueStatus.Failed, error: errorMsg ?? null })
            .where('id', '=', jobId),
    );
    return query
      .with('next', (qb) =>
        qb
          .selectFrom(this.table)
          .where('status', '=', JobQueueStatus.Pending)
          .where('runAfter', '<=', sql<Date>`now()`)
          .orderBy('priority', 'desc')
          .orderBy('id', 'asc')
          .limit(1)
          .forNoKeyUpdate()
          .skipLocked(),
      )
      .updateTable(this.table)
      .set({
        status: JobQueueStatus.Active,
        startedAt: sql<Date>`now()`,
        expiresAt: sql<Date>`now() + ${sql.lit(`'${this.stallTimeout} milliseconds'`)}::interval`,
      })
      .where((eb) => eb('id', '=', eb.selectFrom('next').select('id')))
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Recover stalled jobs: reset jobs whose expires_at has passed
   */
  private recoverStalled() {
    return this.db
      .updateTable(this.table)
      .set({
        status: JobQueueStatus.Pending,
        startedAt: null,
        expiresAt: null,
      })
      .where('status', '=', JobQueueStatus.Active)
      .where('expiresAt', '<', sql<Date>`now()`)
      .executeTakeFirst();
  }

  /**
   * Extend expiry for all active jobs (heartbeat)
   */
  private extendExpiry() {
    if (this.activeJobs.size === 0) {
      return;
    }
    const ids = [...this.activeJobs.keys()];
    return this.db
      .updateTable(this.table)
      .set({
        expiresAt: sql<Date>`now() + ${sql.lit(`'${this.stallTimeout} milliseconds'`)}::interval`,
      })
      .where('id', 'in', ids)
      .execute();
  }

  private startHeartbeat() {
    if (this.heartbeatTimer) {
      return;
    }
    this.heartbeatTimer = setInterval(
      () => this.extendExpiry()?.catch(() => setTimeout(() => this.extendExpiry(), 5000)),
      Math.floor(this.stallTimeout / 2),
    );
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

export class WriteBuffer {
  private buffers = Object.fromEntries(Object.values(QueueName).map((name) => [name as QueueName, [] as InsertRow[]]));
  private pending: Deferred | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private pgPool: postgres.Sql,
    private notify: (queue: QueueName) => Promise<unknown>,
  ) {}

  async add(items: { queue: QueueName; row: InsertRow }[]): Promise<void> {
    if (items.length === 0) {
      return;
    }

    for (const { queue, row } of items) {
      this.buffers[queue].push(row);
    }
    if (!this.timer) {
      this.pending = createDeferred();
      this.timer = setTimeout(() => void this.flush(), 10);
    }
    return this.pending!.promise;
  }

  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const deferred = this.pending;
    this.pending = null;

    const promises: Promise<unknown>[] = [];

    for (const [queue, rows] of Object.entries(this.buffers)) {
      if (rows.length === 0) {
        continue;
      }

      const queueName = queue as QueueName;
      const tableName = QUEUE_TABLE[queueName];

      const copyRows: InsertRow[] = [];
      const insertRows: InsertRow[] = [];
      for (const row of rows) {
        if (row.dedupKey) {
          insertRows.push(row);
        } else {
          copyRows.push(row);
        }
      }
      rows.length = 0;

      if (copyRows.length > 0) {
        promises.push(this.copyInsert(tableName, copyRows).then(() => this.notify(queueName)));
      }
      if (insertRows.length > 0) {
        promises.push(this.insertChunk(tableName, insertRows).then(() => this.notify(queueName)));
      }
    }

    try {
      await Promise.all(promises);
      deferred?.resolve();
    } catch (error) {
      deferred?.reject(error);
    }
  }

  private async copyInsert(tableName: string, rows: InsertRow[]) {
    const writable = await this
      .pgPool`COPY ${this.pgPool(tableName)} (code, data, priority, "runAfter") FROM STDIN WITH (FORMAT csv)`.writable();
    const now = new Date().toISOString();
    for (const row of rows) {
      const data = row.data != null ? csvEscape(JSON.stringify(row.data)) : '';
      const priority = row.priority ?? 0;
      const runAfter = row.runAfter ? row.runAfter.toISOString() : now;
      writable.write(`${row.code},${data},${priority},${runAfter}\n`);
    }
    writable.end();
    await new Promise<void>((resolve, reject) => {
      writable.on('finish', resolve);
      writable.on('error', reject);
    });
  }

  private insertChunk(tableName: string, rows: InsertRow[]) {
    const now = new Date().toISOString();
    return this.pgPool`
      INSERT INTO ${this.pgPool(tableName)} (code, data, priority, "dedupKey", "runAfter")
      SELECT * FROM unnest(
        ${rows.map((r) => r.code)}::smallint[],
        ${rows.map((r) => (r.data != null ? JSON.stringify(r.data) : null))}::jsonb[],
        ${rows.map((r) => r.priority ?? 0)}::smallint[],
        ${rows.map((r) => r.dedupKey)}::text[],
        ${rows.map((r) => r.runAfter?.toISOString() ?? now)}::timestamptz[]
      )
      ON CONFLICT ("dedupKey") WHERE "dedupKey" IS NOT NULL AND status = ${JobQueueStatus.Pending}
      DO NOTHING
    `;
  }
}

const QUEUE_TABLE = {
  [QueueName.ThumbnailGeneration]: 'jobs_thumbnail_generation',
  [QueueName.MetadataExtraction]: 'jobs_metadata_extraction',
  [QueueName.VideoConversion]: 'jobs_video_conversion',
  [QueueName.FaceDetection]: 'jobs_face_detection',
  [QueueName.FacialRecognition]: 'jobs_facial_recognition',
  [QueueName.SmartSearch]: 'jobs_smart_search',
  [QueueName.DuplicateDetection]: 'jobs_duplicate_detection',
  [QueueName.BackgroundTask]: 'jobs_background_task',
  [QueueName.StorageTemplateMigration]: 'jobs_storage_template_migration',
  [QueueName.Migration]: 'jobs_migration',
  [QueueName.Search]: 'jobs_search',
  [QueueName.Sidecar]: 'jobs_sidecar',
  [QueueName.Library]: 'jobs_library',
  [QueueName.Notification]: 'jobs_notification',
  [QueueName.BackupDatabase]: 'jobs_backup_database',
  [QueueName.Ocr]: 'jobs_ocr',
  [QueueName.Workflow]: 'jobs_workflow',
  [QueueName.Editor]: 'jobs_editor',
} as const;

const createDeferred = (): Deferred => {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((_resolve, _reject) => ((resolve = _resolve), (reject = _reject)));
  return { promise, resolve, reject };
};

interface QueueWorkerOptions {
  queueName: QueueName;
  stallTimeout: number;
  claimBatch: number;
  concurrency: number;
  db: Kysely<DB>;
  onJob: (job: JobItem) => Promise<unknown>;
}

type Deferred = { promise: Promise<void>; resolve: () => void; reject: (error: unknown) => void };
