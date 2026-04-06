import { CancellableTask } from '$lib/utils/cancellable-task';

describe('CancellableTask', () => {
  describe('execute', () => {
    it('should execute task successfully and return SUCCESS', async () => {
      const task = new CancellableTask();
      const taskFunction = vi.fn(async (_: AbortSignal) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const result = await task.execute(taskFunction, true);

      expect(result).toBe('SUCCESS');
      expect(task.succeeded).toBe(true);
      expect(task.running).toBe(false);
      expect(taskFunction).toHaveBeenCalledTimes(1);
    });

    it('should call succeededCallback when task completes successfully', async () => {
      const succeededCallback = vi.fn();
      const task = new CancellableTask(succeededCallback);
      const taskFunction = vi.fn(async () => {});

      await task.execute(taskFunction, true);

      expect(succeededCallback).toHaveBeenCalledTimes(1);
    });

    it('should return DONE if task is already executed', async () => {
      const task = new CancellableTask();
      const taskFunction = vi.fn(async () => {});

      await task.execute(taskFunction, true);
      const result = await task.execute(taskFunction, true);

      expect(result).toBe('DONE');
      expect(taskFunction).toHaveBeenCalledTimes(1);
    });

    it('should wait if task is already running', async () => {
      const task = new CancellableTask();
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => {
        resolveTask = resolve;
      });
      const taskFunction = vi.fn(async () => {
        await taskPromise;
      });

      const promise1 = task.execute(taskFunction, true);
      const promise2 = task.execute(taskFunction, true);

      expect(task.running).toBe(true);
      resolveTask!();

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toBe('SUCCESS');
      expect(result2).toBe('WAITED');
      expect(taskFunction).toHaveBeenCalledTimes(1);
    });

    it('should pass AbortSignal to task function', async () => {
      const task = new CancellableTask();
      let capturedSignal: AbortSignal | null = null;
      const taskFunction = async (signal: AbortSignal) => {
        await Promise.resolve();
        capturedSignal = signal;
      };

      await task.execute(taskFunction, true);

      expect(capturedSignal).toBeInstanceOf(AbortSignal);
    });

    it('should set cancellable flag correctly', async () => {
      const task = new CancellableTask();
      const taskFunction = vi.fn(async () => {});

      expect(task.cancellable).toBe(true);
      const promise = task.execute(taskFunction, false);
      expect(task.cancellable).toBe(false);
      await promise;
    });

    it('should not allow transition from prevent cancel to allow cancel when task is running', async () => {
      const task = new CancellableTask();
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => {
        resolveTask = resolve;
      });
      const taskFunction = vi.fn(async () => {
        await taskPromise;
      });

      const promise1 = task.execute(taskFunction, false);
      expect(task.cancellable).toBe(false);

      const promise2 = task.execute(taskFunction, true);
      expect(task.cancellable).toBe(false);

      resolveTask!();
      await Promise.all([promise1, promise2]);
    });
  });

  describe('cancel', () => {
    it('should cancel a running task', async () => {
      const task = new CancellableTask();
      let taskStarted = false;
      const taskFunction = async (signal: AbortSignal) => {
        taskStarted = true;
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (signal.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }
      };

      const promise = task.execute(taskFunction, true);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(taskStarted).toBe(true);

      task.cancel();

      const result = await promise;
      expect(result).toBe('CANCELED');
      expect(task.succeeded).toBe(false);
    });

    it('should call canceledCallback when task is canceled', async () => {
      const canceledCallback = vi.fn();
      const task = new CancellableTask(undefined, canceledCallback);
      const taskFunction = async (signal: AbortSignal) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (signal.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }
      };

      const promise = task.execute(taskFunction, true);
      await new Promise((resolve) => setTimeout(resolve, 10));
      task.cancel();
      await promise;

      expect(canceledCallback).toHaveBeenCalledTimes(1);
    });

    it('should not cancel if task is not cancellable', async () => {
      const task = new CancellableTask();
      const taskFunction = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      const promise = task.execute(taskFunction, false);
      task.cancel();
      const result = await promise;

      expect(result).toBe('SUCCESS');
      expect(task.succeeded).toBe(true);
    });

    it('should return CANCELED when concurrent caller is waiting and task is canceled', async () => {
      const task = new CancellableTask();
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => {
        resolveTask = resolve;
      });
      const taskFunction = async (signal: AbortSignal) => {
        await taskPromise;
        if (signal.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }
      };

      const promise1 = task.execute(taskFunction, true);
      const promise2 = task.execute(taskFunction, true);

      task.cancel();
      resolveTask!();

      const [result1, result2] = await Promise.all([promise1, promise2]);
      expect(result1).toBe('CANCELED');
      expect(result2).toBe('CANCELED');
    });

    it('should not cancel if task is already executed', async () => {
      const task = new CancellableTask();
      const taskFunction = vi.fn(async () => {});

      await task.execute(taskFunction, true);
      expect(task.succeeded).toBe(true);

      task.cancel();
      expect(task.succeeded).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset task to initial state', async () => {
      const task = new CancellableTask();
      const taskFunction = vi.fn(async () => {});

      await task.execute(taskFunction, true);
      expect(task.succeeded).toBe(true);

      await task.reset();

      expect(task.succeeded).toBe(false);
      expect(task.abortController).toBe(null);
      expect(task.running).toBe(false);
    });

    it('should cancel running task before resetting', async () => {
      const task = new CancellableTask();
      const taskFunction = async (signal: AbortSignal) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (signal.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }
      };

      const promise = task.execute(taskFunction, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const resetPromise = task.reset();

      await promise;
      await resetPromise;

      expect(task.succeeded).toBe(false);
      expect(task.running).toBe(false);
    });

    it('should allow re-execution after reset', async () => {
      const task = new CancellableTask();
      const taskFunction = vi.fn(async () => {});

      await task.execute(taskFunction, true);
      await task.reset();
      const result = await task.execute(taskFunction, true);

      expect(result).toBe('SUCCESS');
      expect(task.succeeded).toBe(true);
      expect(taskFunction).toHaveBeenCalledTimes(2);
    });
  });

  describe('waitUntilCompletion', () => {
    it('should return DONE if task is already executed', async () => {
      const task = new CancellableTask();
      const taskFunction = vi.fn(async () => {});

      await task.execute(taskFunction, true);
      const result = await task.waitUntilCompletion();

      expect(result).toBe('DONE');
    });

    it('should return WAITED if task completes while waiting', async () => {
      const task = new CancellableTask();
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => {
        resolveTask = resolve;
      });
      const taskFunction = async () => {
        await taskPromise;
      };

      const executePromise = task.execute(taskFunction, true);
      const waitPromise = task.waitUntilCompletion();

      resolveTask!();

      const [, waitResult] = await Promise.all([executePromise, waitPromise]);

      expect(waitResult).toBe('WAITED');
    });

    it('should return CANCELED if task is canceled', async () => {
      const task = new CancellableTask();
      const taskFunction = async (signal: AbortSignal) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (signal.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }
      };

      const executePromise = task.execute(taskFunction, true);
      const waitPromise = task.waitUntilCompletion();

      await new Promise((resolve) => setTimeout(resolve, 10));
      task.cancel();

      const [, waitResult] = await Promise.all([executePromise, waitPromise]);

      expect(waitResult).toBe('CANCELED');
    });
  });

  describe('waitUntilSucceeded', () => {
    it('should return DONE if task is already executed', async () => {
      const task = new CancellableTask();
      const taskFunction = vi.fn(async () => {});

      await task.execute(taskFunction, true);
      const result = await task.waitUntilSucceeded();

      expect(result).toBe('DONE');
    });

    it('should return WAITED if task completes successfully', async () => {
      const task = new CancellableTask();
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => {
        resolveTask = resolve;
      });
      const taskFunction = async () => {
        await taskPromise;
      };

      const executePromise = task.execute(taskFunction, true);
      const waitPromise = task.waitUntilSucceeded();

      resolveTask!();

      const [, waitResult] = await Promise.all([executePromise, waitPromise]);

      expect(waitResult).toBe('WAITED');
    });

    it('should retry if task is canceled and wait for next execution', async () => {
      vi.useFakeTimers();

      const task = new CancellableTask();
      let attempt = 0;
      const taskFunction = async (signal: AbortSignal) => {
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (signal.aborted && attempt === 1) {
          throw new DOMException('Aborted', 'AbortError');
        }
      };

      // Start first execution
      const executePromise1 = task.execute(taskFunction, true);
      const waitPromise = task.waitUntilSucceeded();

      // Cancel the first execution
      vi.advanceTimersByTime(10);
      task.cancel();
      vi.advanceTimersByTime(100);
      await executePromise1;

      // Start second execution
      const executePromise2 = task.execute(taskFunction, true);
      vi.advanceTimersByTime(100);

      const [executeResult, waitResult] = await Promise.all([executePromise2, waitPromise]);

      expect(executeResult).toBe('SUCCESS');
      expect(waitResult).toBe('WAITED');
      expect(attempt).toBe(2);

      vi.useRealTimers();
    });
  });

  describe('error handling', () => {
    it('should return ERRORED when task throws non-abort error', async () => {
      const task = new CancellableTask();
      const error = new Error('Task failed');
      const taskFunction = async () => {
        await Promise.resolve();
        throw error;
      };

      const result = await task.execute(taskFunction, true);

      expect(result).toBe('ERRORED');
      expect(task.succeeded).toBe(false);
    });

    it('should call errorCallback when task throws non-abort error', async () => {
      const errorCallback = vi.fn();
      const task = new CancellableTask(undefined, undefined, errorCallback);
      const error = new Error('Task failed');
      const taskFunction = async () => {
        await Promise.resolve();
        throw error;
      };

      await task.execute(taskFunction, true);

      expect(errorCallback).toHaveBeenCalledTimes(1);
      expect(errorCallback).toHaveBeenCalledWith(error);
    });

    it('should return ERRORED when task throws AbortError without signal being aborted', async () => {
      const task = new CancellableTask();
      const taskFunction = async () => {
        await Promise.resolve();
        throw new DOMException('Aborted', 'AbortError');
      };

      const result = await task.execute(taskFunction, true);

      expect(result).toBe('ERRORED');
      expect(task.succeeded).toBe(false);
    });

    it('should allow re-execution after error', async () => {
      const task = new CancellableTask();
      const taskFunction1 = async () => {
        await Promise.resolve();
        throw new Error('Failed');
      };
      const taskFunction2 = vi.fn(async () => {});

      const result1 = await task.execute(taskFunction1, true);
      expect(result1).toBe('ERRORED');

      const result2 = await task.execute(taskFunction2, true);
      expect(result2).toBe('SUCCESS');
      expect(task.succeeded).toBe(true);
    });
  });

  describe('running property', () => {
    it('should return true when task is running', async () => {
      const task = new CancellableTask();
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => {
        resolveTask = resolve;
      });
      const taskFunction = async () => {
        await taskPromise;
      };

      expect(task.running).toBe(false);

      const promise = task.execute(taskFunction, true);
      expect(task.running).toBe(true);

      resolveTask!();
      await promise;

      expect(task.running).toBe(false);
    });
  });

  describe('complete promise', () => {
    it('should resolve when task completes successfully', async () => {
      const task = new CancellableTask();
      const taskFunction = vi.fn(async () => {});

      const completePromise = task.complete;
      await task.execute(taskFunction, true);
      await expect(completePromise).resolves.toBeUndefined();
    });

    it('should reject when task is canceled', async () => {
      const task = new CancellableTask();
      const taskFunction = async (signal: AbortSignal) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (signal.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }
      };

      const completePromise = task.complete;
      const promise = task.execute(taskFunction, true);
      await new Promise((resolve) => setTimeout(resolve, 10));
      task.cancel();
      await promise;

      await expect(completePromise).rejects.toBeUndefined();
    });

    it('should reject when task errors', async () => {
      const task = new CancellableTask();
      const taskFunction = async () => {
        await Promise.resolve();
        throw new Error('Failed');
      };

      const completePromise = task.complete;
      await task.execute(taskFunction, true);

      await expect(completePromise).rejects.toBeUndefined();
    });
  });

  describe('abort signal handling', () => {
    it('should automatically call abort() on signal when task is canceled', async () => {
      const task = new CancellableTask();
      let capturedSignal: AbortSignal | null = null;
      const taskFunction = async (signal: AbortSignal) => {
        capturedSignal = signal;
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (signal.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }
      };

      const promise = task.execute(taskFunction, true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedSignal).not.toBeNull();
      expect(capturedSignal!.aborted).toBe(false);

      task.cancel();

      expect(capturedSignal!.aborted).toBe(true);

      const result = await promise;
      expect(result).toBe('CANCELED');
    });

    it('should detect if signal was aborted after task completes', async () => {
      const task = new CancellableTask();
      let controller: AbortController | null = null;
      const taskFunction = async (_: AbortSignal) => {
        // Capture the controller to abort it externally before the function returns
        controller = task.abortController;
        await new Promise((resolve) => setTimeout(resolve, 10));
        controller?.abort();
      };

      const result = await task.execute(taskFunction, true);

      expect(result).toBe('CANCELED');
      expect(task.succeeded).toBe(false);
    });

    it('should handle abort signal in async operations', async () => {
      const task = new CancellableTask();
      const taskFunction = async (signal: AbortSignal) => {
        return new Promise<void>((resolve, reject) => {
          signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
          setTimeout(() => resolve(), 100);
        });
      };

      const promise = task.execute(taskFunction, true);
      await new Promise((resolve) => setTimeout(resolve, 10));
      task.cancel();

      const result = await promise;
      expect(result).toBe('CANCELED');
    });
  });
});
