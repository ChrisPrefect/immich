/**
 * A one-shot async task with cancellation support via AbortController/AbortSignal.
 *
 * State machine:
 *
 *   IDLE ──execute()──▶ RUNNING ──task succeeds──▶ SUCCEEDED (terminal)
 *                          │
 *                          ├──cancel()/abort──▶ CANCELED ──▶ IDLE
 *                          └──task throws─────▶ ERRORED ──▶ IDLE
 *
 * SUCCEEDED is terminal — further execute() calls return 'DONE'.
 * Call reset() to move from SUCCEEDED back to IDLE for re-execution.
 *
 * execute() return values: 'SUCCESS' | 'DONE' | 'WAITED' | 'CANCELED' | 'ERRORED'
 */
export class CancellableTask {
  abortController: AbortController | null = null;
  cancellable: boolean = true;
  /**
   * A promise that resolves once the task completes, and rejects if the task is canceled or errored.
   */
  complete!: Promise<unknown>;
  succeeded: boolean = false;

  private completeResolve: (() => void) | undefined;
  private completeReject: (() => void) | undefined;

  constructor(
    private succeededCallback?: () => void,
    private canceledCallback?: () => void,
    private errorCallback?: (error: unknown) => void,
  ) {
    this.init();
  }

  get running() {
    return !!this.abortController;
  }

  async waitUntilCompletion() {
    if (this.succeeded) {
      return 'DONE';
    }
    try {
      await this.complete;
      return 'WAITED';
    } catch {
      // expected when canceled
    }
    return 'CANCELED';
  }

  async waitUntilSucceeded() {
    // Keep retrying until the task completes successfully (not canceled)
    for (;;) {
      try {
        if (this.succeeded) {
          return 'DONE';
        }
        await this.complete;
        return 'WAITED';
      } catch {
        continue;
      }
    }
  }

  async execute(task: (abortSignal: AbortSignal) => Promise<void>, cancellable: boolean) {
    if (this.succeeded) {
      return 'DONE';
    }

    // if promise is pending, wait on previous request instead.
    if (this.abortController) {
      if (!cancellable) {
        this.cancellable = false;
      }
      try {
        await this.complete;
        return 'WAITED';
      } catch {
        return 'CANCELED';
      }
    }
    this.cancellable = cancellable;
    const abortController = (this.abortController = new AbortController());

    try {
      await task(abortController.signal);
      if (abortController.signal.aborted) {
        return 'CANCELED';
      }
      this.#transitionToSucceeded();
      return 'SUCCESS';
    } catch (error) {
      if (abortController.signal.aborted) {
        return 'CANCELED';
      }
      this.#transitionToErrored(error);
      return 'ERRORED';
    } finally {
      if (this.abortController === abortController) {
        this.abortController = null;
      }
    }
  }

  private init() {
    this.abortController = null;
    this.succeeded = false;
    this.complete = new Promise<void>((resolve, reject) => {
      this.completeResolve = resolve;
      this.completeReject = reject;
    });
    // Suppress unhandled rejection warning
    this.complete.catch(() => {});
  }

  async reset() {
    this.#transitionToCancelled();
    if (this.abortController) {
      await this.waitUntilCompletion();
    }
    this.init();
  }

  cancel() {
    this.#transitionToCancelled();
  }

  #transitionToCancelled() {
    if (this.succeeded) {
      return;
    }
    if (!this.cancellable) {
      return;
    }
    this.abortController?.abort();
    this.completeReject?.();
    this.init();
    this.canceledCallback?.();
  }

  #transitionToSucceeded() {
    this.succeeded = true;
    this.completeResolve?.();
    this.succeededCallback?.();
  }

  #transitionToErrored(error: unknown) {
    this.completeReject?.();
    this.init();
    this.errorCallback?.(error);
  }
}
