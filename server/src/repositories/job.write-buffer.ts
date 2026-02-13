import { Kysely, sql } from 'kysely';
import { QueueName } from 'src/enum';
import { DB } from 'src/schema';

export type InsertRow = {
  name: string;
  data: unknown;
  priority: number;
  dedup_key: string | null;
  run_after: Date;
};

type QueueTableName = keyof DB & `jobs_${string}`;

export const QUEUE_TABLE: Record<QueueName, QueueTableName> = {
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
};

type Deferred = { promise: Promise<void>; resolve: () => void };

const createDeferred = (): Deferred => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
};

const CHUNK_SIZE = 5000;

export class WriteBuffer {
  private buffers = new Map<QueueName, InsertRow[]>();
  private pending: Deferred | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private db: Kysely<DB>,
    private notify: (queue: QueueName) => Promise<void>,
  ) {}

  async add(items: { queue: QueueName; row: InsertRow }[]): Promise<void> {
    for (const { queue, row } of items) {
      let buf = this.buffers.get(queue);
      if (!buf) {
        buf = [];
        this.buffers.set(queue, buf);
      }
      buf.push(row);
    }
    if (!this.timer) {
      this.pending = createDeferred();
      this.timer = setTimeout(() => void this.flush(), 10);
    }
    return this.pending!.promise;
  }

  async flush(): Promise<void> {
    const snapshot = this.buffers;
    this.buffers = new Map();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const deferred = this.pending;
    this.pending = null;

    if (snapshot.size === 0) {
      deferred?.resolve();
      return;
    }

    try {
      for (const [queue, rows] of snapshot) {
        const tableName = QUEUE_TABLE[queue];
        for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
          const chunk = rows.slice(i, i + CHUNK_SIZE);
          await this.insertChunk(tableName, chunk);
        }
        await this.notify(queue);
      }
    } finally {
      deferred?.resolve();
    }
  }

  private async insertChunk(tableName: string, rows: InsertRow[]): Promise<void> {
    const names = rows.map((r) => r.name);
    const datas = rows.map((r) => JSON.stringify(r.data));
    const priorities = rows.map((r) => r.priority);
    const dedupKeys = rows.map((r) => r.dedup_key);
    const runAfters = rows.map((r) => r.run_after.toISOString());

    await sql`
      INSERT INTO ${sql.table(tableName)} ("name", "data", "priority", "dedup_key", "run_after")
      SELECT * FROM unnest(
        ${sql.val(names)}::"char"[],
        ${sql.val(datas)}::jsonb[],
        ${sql.val(priorities)}::smallint[],
        ${sql.val(dedupKeys)}::text[],
        ${sql.val(runAfters)}::timestamptz[]
      )
      ON CONFLICT ("dedup_key") WHERE "dedup_key" IS NOT NULL AND "status" = 'p'::"char"
      DO NOTHING
    `.execute(this.db);
  }
}
