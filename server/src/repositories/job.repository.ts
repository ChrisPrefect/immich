import { Injectable } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { ClassConstructor } from 'class-transformer';
import { Kysely, sql } from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import { setTimeout } from 'node:timers/promises';
import postgres from 'postgres';
import { JobConfig } from 'src/decorators';
import { QueueJobResponseDto, QueueJobSearchDto } from 'src/dtos/queue.dto';
import {
  JOB_CODE_TO_NAME,
  JobCode,
  JobName,
  JobQueueStatus,
  JobStatus,
  MetadataKey,
  QueueCleanType,
  QueueJobStatus,
  QueueName,
} from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { ConcurrentQueueName, JobCounts, JobItem, JobOf } from 'src/types';
import { asPostgresConnectionConfig } from 'src/utils/database';
import { getTable, InsertRow, QueueWorker, WriteBuffer } from 'src/utils/job-queue.util';
import { getKeyByValue, getMethodNames, ImmichStartupError } from 'src/utils/misc';

type JobMapItem = {
  jobName: JobName;
  queueName: QueueName;
  handler: (job: JobOf<any>) => Promise<JobStatus>;
  label: string;
};

const SERIAL_QUEUES = [
  QueueName.FacialRecognition,
  QueueName.StorageTemplateMigration,
  QueueName.DuplicateDetection,
  QueueName.BackupDatabase,
];

export const isConcurrentQueue = (name: QueueName): name is ConcurrentQueueName => !SERIAL_QUEUES.includes(name);

const getClaimBatch = (queueName: QueueName): number => {
  if (SERIAL_QUEUES.includes(queueName)) {
    return 1;
  }

  switch (queueName) {
    case QueueName.VideoConversion: {
      return 1;
    }
    case QueueName.FaceDetection:
    case QueueName.SmartSearch:
    case QueueName.Ocr: {
      return 2;
    }
    default: {
      return 100; // will be clamped to slotsAvailable by the worker
    }
  }
};

const STATUS_FILTER = {
  [QueueJobStatus.Active]: JobQueueStatus.Active,
  [QueueJobStatus.Failed]: null as null, // failures are in a separate table
  [QueueJobStatus.Waiting]: JobQueueStatus.Pending,
  [QueueJobStatus.Complete]: null as null, // completed jobs are deleted
  [QueueJobStatus.Delayed]: JobQueueStatus.Pending, // delayed = pending with future run_after
  [QueueJobStatus.Paused]: JobQueueStatus.Pending, // paused queue has pending jobs
};

@Injectable()
export class JobRepository {
  private workers: Partial<Record<QueueName, QueueWorker>> = {};
  private handlers: Partial<Record<JobName, JobMapItem>> = {};
  private writeBuffer!: WriteBuffer;
  private pool: postgres.Sql | null = null;
  private db!: Kysely<DB>;
  private listenConn: postgres.Sql | null = null;
  private listenReady = false;
  private pauseState: Partial<Record<QueueName, boolean>> = {};

  constructor(
    private moduleRef: ModuleRef,
    private configRepository: ConfigRepository,
    private eventRepository: EventRepository,
    private logger: LoggingRepository,
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

    this.pool = this.createPgConnection({ max: 20, connection: { synchronous_commit: 'off' } });
    this.db = new Kysely<DB>({ dialect: new PostgresJSDialect({ postgres: this.pool }) });
    this.writeBuffer = new WriteBuffer(this.pool, (queue) => this.notify(queue));
  }

  async startWorkers() {
    // Startup sweep: reset any active jobs from a previous crash
    await Promise.all(
      Object.values(QueueName).map((queueName) =>
        this.db
          .updateTable(getTable(this.db, queueName))
          .set({ status: JobQueueStatus.Pending, startedAt: null, expiresAt: null })
          .where('status', '=', JobQueueStatus.Active)
          .where('expiresAt', '<', sql<Date>`now()`) // needed for multi-instance safety
          .execute(),
      ),
    );

    for (const queueName of Object.values(QueueName)) {
      this.workers[queueName] = new QueueWorker({
        queueName,
        stallTimeout: 5 * 60 * 1000, // 5 min
        claimBatch: getClaimBatch(queueName),
        maxRetries: 5,
        backoffBaseMs: 30_000,
        concurrency: 1,
        db: this.db,
        onJob: (job) => this.eventRepository.emit('JobRun', queueName, job),
      });
    }

    await this.setupListen();
  }

  run({ name, data }: JobItem) {
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

  async isActive(name: QueueName): Promise<boolean> {
    const result = await this.db
      .selectFrom(getTable(this.db, name))
      .select('id')
      .where('status', '=', JobQueueStatus.Active)
      .limit(1)
      .executeTakeFirst();
    return result !== undefined;
  }

  isPaused(name: QueueName): Promise<boolean> {
    return Promise.resolve(this.pauseState[name] ?? false);
  }

  async pause(name: QueueName) {
    this.pauseState[name] = true;
    await this.db
      .insertInto('job_queue_meta')
      .values({ queueName: name, isPaused: true })
      .onConflict((oc) => oc.column('queueName').doUpdateSet({ isPaused: true }))
      .execute();
    this.workers[name]?.pause();
    await this.notify(name, 'pause');
  }

  async resume(name: QueueName) {
    this.pauseState[name] = false;
    await this.db
      .insertInto('job_queue_meta')
      .values({ queueName: name, isPaused: false })
      .onConflict((oc) => oc.column('queueName').doUpdateSet({ isPaused: false }))
      .execute();
    this.workers[name]?.resume();
    await this.notify(name, 'resume');
  }

  empty(name: QueueName) {
    return this.db.deleteFrom(getTable(this.db, name)).where('status', '=', JobQueueStatus.Pending).execute();
  }

  clear(name: QueueName, _type: QueueCleanType) {
    return this.db.deleteFrom('job_failures').where('queueName', '=', name).execute();
  }

  async getJobCounts(name: QueueName): Promise<JobCounts> {
    const [statusResult, failedResult] = await Promise.all([
      this.db
        .selectFrom(getTable(this.db, name))
        .select((eb) => ['status', eb.fn.countAll<number>().as('count')])
        .groupBy('status')
        .execute(),
      this.db
        .selectFrom('job_failures')
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .where('queueName', '=', name)
        .executeTakeFirst(),
    ]);

    const counts: JobCounts = {
      active: 0,
      completed: 0,
      failed: Number(failedResult?.count ?? 0),
      delayed: 0,
      waiting: 0,
      paused: 0,
    };

    for (const row of statusResult) {
      switch (row.status) {
        case JobQueueStatus.Pending: {
          counts.waiting = Number(row.count);
          break;
        }
        case JobQueueStatus.Active: {
          counts.active = Number(row.count);
          break;
        }
      }
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

  queueAll(items: JobItem[]): Promise<void> {
    if (items.length === 0) {
      return Promise.resolve();
    }

    const bufferItems: { queue: QueueName; row: InsertRow }[] = [];
    for (const item of items) {
      const queueName = this.getQueueName(item.name);
      const options = this.getJobOptions(item);
      bufferItems.push({
        queue: queueName,
        row: {
          code: JobCode[item.name],
          data: item.data ?? null,
          priority: options?.priority ?? null,
          dedupKey: options?.dedupKey ?? null,
          runAfter: options?.delay ? new Date(Date.now() + options.delay) : null,
        },
      });
    }

    return this.writeBuffer.add(bufferItems);
  }

  queue(item: JobItem): Promise<void> {
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
    const requestedStatuses = dto.status ?? Object.values(QueueJobStatus);
    const includeFailed = requestedStatuses.includes(QueueJobStatus.Failed);

    const statuses: JobQueueStatus[] = [];
    for (const status of requestedStatuses) {
      const mapped = STATUS_FILTER[status];
      if (mapped !== null && !statuses.includes(mapped)) {
        statuses.push(mapped);
      }
    }

    const results: QueueJobResponseDto[] = [];

    if (statuses.length > 0) {
      const rows = await this.db
        .selectFrom(getTable(this.db, name))
        .select(['id', 'code', 'data', 'runAfter'])
        .where('status', 'in', statuses)
        .orderBy('id', 'desc')
        .limit(1000)
        .execute();

      for (const row of rows) {
        results.push({
          id: String(row.id),
          name: JOB_CODE_TO_NAME[row.code],
          data: (row.data ?? {}) as object,
          timestamp: new Date(row.runAfter).getTime(),
        });
      }
    }

    if (includeFailed) {
      const failedRows = await this.db
        .selectFrom('job_failures')
        .select(['id', 'code', 'data', 'failedAt'])
        .where('queueName', '=', name)
        .orderBy('id', 'desc')
        .limit(1000)
        .execute();

      for (const row of failedRows) {
        results.push({
          id: `f-${row.id}`,
          name: JOB_CODE_TO_NAME[row.code],
          data: (row.data ?? {}) as object,
          timestamp: new Date(row.failedAt).getTime(),
        });
      }
    }

    return results;
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

  private createPgConnection(options?: { max?: number; connection?: Record<string, string> }) {
    const { database } = this.configRepository.getEnv();
    const pgConfig = asPostgresConnectionConfig(database.config);
    return postgres({
      host: pgConfig.host,
      port: pgConfig.port,
      username: pgConfig.username,
      password: pgConfig.password as string | undefined,
      database: pgConfig.database,
      ssl: pgConfig.ssl as boolean | undefined,
      max: options?.max ?? 1,
      connection: options?.connection,
    });
  }

  private async setupListen(): Promise<void> {
    if (this.listenConn) {
      await this.listenConn.end();
      this.listenConn = null;
    }

    this.listenConn = this.createPgConnection();

    for (const queueName of Object.values(QueueName)) {
      await this.listenConn.listen(
        `jobs:${queueName}`,
        (payload) => this.onNotify(queueName, payload),
        () => this.onReconnect(),
      );
    }

    this.listenReady = true;
    await this.syncPauseState();
    for (const worker of Object.values(this.workers)) {
      worker.onNotification();
    }
  }

  private onNotify(queueName: QueueName, payload: string) {
    switch (payload) {
      case 'pause': {
        this.pauseState[queueName] = true;
        this.workers[queueName]?.pause();
        break;
      }
      case 'resume': {
        this.pauseState[queueName] = false;
        this.workers[queueName]?.resume();
        break;
      }
      default: {
        this.workers[queueName]?.onNotification();
        break;
      }
    }
  }

  private onReconnect() {
    if (!this.listenReady) {
      return;
    }
    this.listenReady = false;
    this.logger.log('LISTEN connection re-established, syncing state');
    void this.syncPauseState().then(() => {
      for (const worker of Object.values(this.workers)) {
        worker.onNotification();
      }
      this.listenReady = true;
    });
  }

  private async syncPauseState(): Promise<void> {
    const metaRows = await this.db.selectFrom('job_queue_meta').selectAll().execute();
    for (const row of metaRows) {
      const queueName = row.queueName as QueueName;
      const wasPaused = this.pauseState[queueName] ?? false;
      this.pauseState[queueName] = row.isPaused;
      if (wasPaused && !row.isPaused) {
        this.workers[queueName]?.resume();
      } else if (!wasPaused && row.isPaused) {
        this.workers[queueName]?.pause();
      }
    }
  }

  private notify(queue: QueueName, payload = '') {
    return sql`SELECT pg_notify(${`jobs:${queue}`}, ${payload})`.execute(this.db);
  }

  async onShutdown(): Promise<void> {
    const shutdownPromises = Object.values(this.workers).map((worker) => worker.shutdown());
    await Promise.all(shutdownPromises);

    if (this.writeBuffer) {
      await this.writeBuffer.flush();
    }

    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    if (this.listenConn) {
      await this.listenConn.end();
      this.listenConn = null;
    }
  }
}
