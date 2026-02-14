import { JobRepository } from 'src/repositories/job.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newJobRepositoryMock = (): Mocked<RepositoryInterface<JobRepository>> => {
  return {
    setup: vitest.fn(),
    startWorkers: vitest.fn(),
    run: vitest.fn(),
    setConcurrency: vitest.fn(),
    empty: vitest.fn(),
    pause: vitest.fn(),
    resume: vitest.fn(),
    searchJobs: vitest.fn(),
    queue: vitest.fn(),
    queueAll: vitest.fn(),
    isActive: vitest.fn(),
    isPaused: vitest.fn(),
    getJobCounts: vitest.fn(),
    clear: vitest.fn(),
    waitForQueueCompletion: vitest.fn(),
    onShutdown: vitest.fn(),
  };
};
