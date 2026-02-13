import { Injectable } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { Kysely, sql } from 'kysely';
import { ClassConstructor } from 'class-transformer';
import { setTimeout } from 'node:timers/promises';
import { InjectKysely } from 'nestjs-kysely';
import postgres from 'postgres';
import { JobConfig } from 'src/decorators';
import { QueueJobResponseDto, QueueJobSearchDto } from 'src/dtos/queue.dto';
import { JobName, JobStatus, MetadataKey, QueueCleanType, QueueJobStatus, QueueName } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { QUEUE_TABLE, WriteBuffer } from 'src/repositories/job.write-buffer';
import { charToJobName, jobNameToChar, QueueWorker } from 'src/repositories/job.worker';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { JobCounts, JobItem, JobOf } from 'src/types';
import { asPostgresConnectionConfig } from 'src/utils/database';
import { getKeyByValue, getMethodNames, ImmichStartupError } from 'src/utils/misc';

type JobMapItem = {
  jobName: JobName;
  queueName: QueueName;
  handler: (job: JobOf<any>) => Promise<JobStatus>;
  label: string;
};

// Status char codes
const STATUS_PENDING = 'p';
const STATUS_ACTIVE = 'a';
const STATUS_FAILED = 'f';

// Stall timeouts in milliseconds
const STALL_LONG = 60 * 60 * 1000; // 1 hour
const STALL_MEDIUM = 30 * 60 * 1000; // 30 min
const STALL_DEFAULT = 5 * 60 * 1000; // 5 min

const getStallTimeout = (queueName: QueueName): number => {
  switch (queueName) {
    case QueueName.VideoConversion:
    case QueueName.BackupDatabase:
    case QueueName.Editor: {
      return STALL_LONG;
    }
    case QueueName.Library:
    case QueueName.StorageTemplateMigration: {
      return STALL_MEDIUM;
    }
    default: {
      return STALL_DEFAULT;
    }
  }
};

const getClaimBatch = (queueName: QueueName): number => {
  switch (queueName) {
    case QueueName.VideoConversion:
    case QueueName.BackupDatabase:
    case QueueName.StorageTemplateMigration:
    case QueueName.Editor:
    case QueueName.FacialRecognition:
    case QueueName.DuplicateDetection: {
      return 1;
    }
    default: {
      return 100; // will be clamped to slotsAvailable by the worker
    }
  }
};

// Map QueueJobStatus to our "char" status codes
const STATUS_FILTER: Record<QueueJobStatus, string | null> = {
  [QueueJobStatus.Active]: STATUS_ACTIVE,
  [QueueJobStatus.Failed]: STATUS_FAILED,
  [QueueJobStatus.Waiting]: STATUS_PENDING,
  [QueueJobStatus.Complete]: null, // completed jobs are deleted
  [QueueJobStatus.Delayed]: STATUS_PENDING, // delayed = pending with future run_after
  [QueueJobStatus.Paused]: STATUS_PENDING, // paused queue has pending jobs
};

@Injectable()
export class JobRepository {
  private workers: Partial<Record<QueueName, QueueWorker>> = {};
  private handlers: Partial<Record<JobName, JobMapItem>> = {};
  private writeBuffer!: WriteBuffer;
  private listenConn: postgres.Sql | null = null;
  private pauseState: Partial<Record<QueueName, boolean>> = {};

  constructor(
    private moduleRef: ModuleRef,
    private configRepository: ConfigRepository,
    private eventRepository: EventRepository,
    private logger: LoggingRepository,
    @InjectKysely() private db: Kysely<DB>,
  ) {
    this.logger.setContext(JobRepository.name);
  }

  setup(services: ClassConstructor<unknown>[]) {
    const reflector = this.moduleRef.get(Reflector, { strict: false });

    // discovery
    for (const Service of services) {
      const instance = this.moduleRef.get<any>(Service);
      for (const methodName of getMethodNames(instance)) {
        const handler = instance[methodName];
        const config = reflector.get<JobConfig>(MetadataKey.JobConfig, handler);
        if (!config) {
          continue;
        }

        const { name: jobName, queue: queueName } = config;
        const label = `${Service.name}.${handler.name}`;

        // one handler per job
        if (this.handlers[jobName]) {
          const jobKey = getKeyByValue(JobName, jobName);
          const errorMessage = `Failed to add job handler for ${label}`;
          this.logger.error(
            `${errorMessage}. JobName.${jobKey} is already handled by ${this.handlers[jobName].label}.`,
          );
          throw new ImmichStartupError(errorMessage);
        }

        this.handlers[jobName] = {
          label,
          jobName,
          queueName,
          handler: handler.bind(instance),
        };

        this.logger.verbose(`Added job handler: ${jobName} => ${label}`);
      }
    }

    // no missing handlers
    for (const [jobKey, jobName] of Object.entries(JobName)) {
      const item = this.handlers[jobName];
      if (!item) {
        const errorMessage = `Failed to find job handler for Job.${jobKey} ("${jobName}")`;
        this.logger.error(
          `${errorMessage}. Make sure to add the @OnJob({ name: JobName.${jobKey}, queue: QueueName.XYZ }) decorator for the new job.`,
        );
        throw new ImmichStartupError(errorMessage);
      }
    }
  }

  startWorkers() {
    this.writeBuffer = new WriteBuffer(this.db, (queue) => this.notify(queue));

    // Startup sweep: reset any active jobs from a previous crash
    const startupPromises = Object.values(QueueName).map(async (queueName) => {
      const tableName = QUEUE_TABLE[queueName];
      await sql`
        UPDATE ${sql.table(tableName)}
        SET "status" = ${STATUS_PENDING}::"char", "started_at" = NULL, "expires_at" = NULL
        WHERE "status" = ${STATUS_ACTIVE}::"char"
      `.execute(this.db);
    });

    // Load pause state and setup workers
    void Promise.all(startupPromises).then(async () => {
      // Load pause state from DB
      const metaRows = await this.db.selectFrom('job_queue_meta').selectAll().execute();
      for (const row of metaRows) {
        this.pauseState[row.queue_name as QueueName] = row.is_paused;
      }

      // Create workers
      for (const queueName of Object.values(QueueName)) {
        const worker = new QueueWorker({
          queueName,
          tableName: QUEUE_TABLE[queueName],
          stallTimeout: getStallTimeout(queueName),
          claimBatch: getClaimBatch(queueName),
          concurrency: 1,
          db: this.db,
          onJob: (job) => this.eventRepository.emit('JobRun', queueName, job),
        });

        if (this.pauseState[queueName]) {
          worker.pause();
        }

        this.workers[queueName] = worker;
      }

      // Setup LISTEN/NOTIFY
      await this.setupListen();

      // Trigger initial fetch for all workers
      for (const worker of Object.values(this.workers)) {
        worker.onNotification();
      }
    });
  }

  async run({ name, data }: JobItem) {
    const item = this.handlers[name as JobName];
    if (!item) {
      this.logger.warn(`Skipping unknown job: "${name}"`);
      return JobStatus.Skipped;
    }

    return item.handler(data);
  }

  setConcurrency(queueName: QueueName, concurrency: number) {
    const worker = this.workers[queueName];
    if (!worker) {
      this.logger.warn(`Unable to set queue concurrency, worker not found: '${queueName}'`);
      return;
    }

    worker.setConcurrency(concurrency);
  }

  isActive(name: QueueName): Promise<boolean> {
    const worker = this.workers[name];
    return Promise.resolve(worker ? worker.activeJobCount > 0 : false);
  }

  isPaused(name: QueueName): Promise<boolean> {
    return Promise.resolve(this.pauseState[name] ?? false);
  }

  async pause(name: QueueName) {
    this.pauseState[name] = true;
    await this.db
      .insertInto('job_queue_meta')
      .values({ queue_name: name, is_paused: true })
      .onConflict((oc) => oc.column('queue_name').doUpdateSet({ is_paused: true }))
      .execute();
    this.workers[name]?.pause();
  }

  async resume(name: QueueName) {
    this.pauseState[name] = false;
    await this.db
      .insertInto('job_queue_meta')
      .values({ queue_name: name, is_paused: false })
      .onConflict((oc) => oc.column('queue_name').doUpdateSet({ is_paused: false }))
      .execute();
    this.workers[name]?.resume();
  }

  async empty(name: QueueName) {
    const tableName = QUEUE_TABLE[name];
    await sql`DELETE FROM ${sql.table(tableName)} WHERE "status" = ${STATUS_PENDING}::"char"`.execute(this.db);
  }

  async clear(name: QueueName, _type: QueueCleanType) {
    const tableName = QUEUE_TABLE[name];
    await sql`DELETE FROM ${sql.table(tableName)} WHERE "status" = ${STATUS_FAILED}::"char"`.execute(this.db);
  }

  async getJobCounts(name: QueueName): Promise<JobCounts> {
    const tableName = QUEUE_TABLE[name];
    const result = await sql<{ status: string; count: string }>`
      SELECT "status", count(*)::text as count FROM ${sql.table(tableName)} GROUP BY "status"
    `.execute(this.db);

    const counts: JobCounts = {
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      waiting: 0,
      paused: 0,
    };

    for (const row of result.rows) {
      switch (row.status) {
        case STATUS_PENDING: {
          counts.waiting = Number(row.count);
          break;
        }
        case STATUS_ACTIVE: {
          counts.active = Number(row.count);
          break;
        }
        case STATUS_FAILED: {
          counts.failed = Number(row.count);
          break;
        }
      }
    }

    // In-memory active count may be more accurate than DB for in-flight jobs
    const worker = this.workers[name];
    if (worker) {
      counts.active = worker.activeJobCount;
    }

    if (this.pauseState[name]) {
      counts.paused = counts.waiting;
      counts.waiting = 0;
    }

    return counts;
  }

  private getQueueName(name: JobName) {
    return (this.handlers[name] as JobMapItem).queueName;
  }

  async queueAll(items: JobItem[]): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const bufferItems: { queue: QueueName; row: { name: string; data: unknown; priority: number; dedup_key: string | null; run_after: Date } }[] = [];

    for (const item of items) {
      const queueName = this.getQueueName(item.name);
      const options = this.getJobOptions(item);
      bufferItems.push({
        queue: queueName,
        row: {
          name: jobNameToChar(item.name),
          data: item.data || {},
          priority: options?.priority ?? 0,
          dedup_key: options?.dedupKey ?? null,
          run_after: options?.delay ? new Date(Date.now() + options.delay) : new Date(),
        },
      });
    }

    await this.writeBuffer.add(bufferItems);
  }

  async queue(item: JobItem): Promise<void> {
    return this.queueAll([item]);
  }

  async waitForQueueCompletion(...queues: QueueName[]): Promise<void> {
    const getPending = async () => {
      const results = await Promise.all(queues.map(async (name) => ({ pending: await this.isActive(name), name })));
      return results.filter(({ pending }) => pending).map(({ name }) => name);
    };

    let pending = await getPending();

    while (pending.length > 0) {
      this.logger.verbose(`Waiting for ${pending[0]} queue to stop...`);
      await setTimeout(1000);
      pending = await getPending();
    }
  }

  async searchJobs(name: QueueName, dto: QueueJobSearchDto): Promise<QueueJobResponseDto[]> {
    const tableName = QUEUE_TABLE[name];
    const statuses = dto.status ?? Object.values(QueueJobStatus);
    const charStatuses = statuses
      .map((s) => STATUS_FILTER[s])
      .filter((s): s is string => s !== null);

    if (charStatuses.length === 0) {
      return [];
    }

    const uniqueStatuses = [...new Set(charStatuses)];

    const rows = await sql<{ id: number; name: string; data: unknown; run_after: Date }>`
      SELECT "id", "name", "data", "run_after"
      FROM ${sql.table(tableName)}
      WHERE "status" = ANY(${sql.val(uniqueStatuses)}::"char"[])
      ORDER BY "id" DESC
      LIMIT 1000
    `.execute(this.db);

    return rows.rows.map((row) => ({
      id: String(row.id),
      name: charToJobName(row.name) ?? (row.name as unknown as JobName),
      data: (row.data ?? {}) as object,
      timestamp: new Date(row.run_after).getTime(),
    }));
  }

  private getJobOptions(item: JobItem): { dedupKey?: string; priority?: number; delay?: number } | null {
    switch (item.name) {
      case JobName.NotifyAlbumUpdate: {
        return {
          dedupKey: `${item.data.id}/${item.data.recipientId}`,
          delay: item.data?.delay,
        };
      }
      case JobName.StorageTemplateMigrationSingle: {
        return { dedupKey: item.data.id };
      }
      case JobName.PersonGenerateThumbnail: {
        return { priority: 1 };
      }
      case JobName.FacialRecognitionQueueAll: {
        return { dedupKey: JobName.FacialRecognitionQueueAll };
      }
      default: {
        return null;
      }
    }
  }

  /** @deprecated */
  // todo: remove this when asset notifications no longer need it.
  public async removeJob(name: JobName, jobID: string): Promise<void> {
    const queueName = this.getQueueName(name);
    const tableName = QUEUE_TABLE[queueName];
    await sql`DELETE FROM ${sql.table(tableName)} WHERE "id" = ${Number(jobID)}`.execute(this.db);
  }

  private async setupListen(): Promise<void> {
    const { database } = this.configRepository.getEnv();
    const pgConfig = asPostgresConnectionConfig(database.config);
    this.listenConn = postgres({
      host: pgConfig.host,
      port: pgConfig.port,
      username: pgConfig.username,
      password: pgConfig.password as string | undefined,
      database: pgConfig.database,
      ssl: pgConfig.ssl as boolean | undefined,
      max: 1,
    });

    for (const queueName of Object.values(QueueName)) {
      await this.listenConn.listen(`jobs:${queueName}`, () => {
        this.workers[queueName]?.onNotification();
      });
    }
  }

  private async notify(queue: QueueName): Promise<void> {
    await sql`SELECT pg_notify(${`jobs:${queue}`}, '')`.execute(this.db);
  }

  async onShutdown(): Promise<void> {
    // Stop workers
    const shutdownPromises = Object.values(this.workers).map((worker) => worker.shutdown());
    await Promise.all(shutdownPromises);

    // Flush write buffer
    if (this.writeBuffer) {
      await this.writeBuffer.flush();
    }

    // Close LISTEN connection
    if (this.listenConn) {
      await this.listenConn.end();
      this.listenConn = null;
    }
  }
}
