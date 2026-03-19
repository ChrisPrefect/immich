import { tick } from 'svelte';

interface TransitionRequest {
  types?: string[];
  prepareOldSnapshot?: () => void;
  performUpdate: (signal: AbortSignal) => Promise<void>;
  prepareNewSnapshot?: () => void;
  onFinished?: () => void;
}

export class ViewTransitionManager {
  #activeViewTransition = $state<ViewTransition | null>(null);
  #activeOnFinished: (() => void) | undefined;

  get activeViewTransition() {
    return this.#activeViewTransition;
  }

  isSupported() {
    return 'startViewTransition' in document;
  }

  skipTransitions() {
    const skipped = !!this.#activeViewTransition;
    this.#activeViewTransition?.skipTransition();
    this.#activeViewTransition = null;
    const onFinished = this.#activeOnFinished;
    this.#activeOnFinished = undefined;
    onFinished?.();
    return skipped;
  }

  async startTransition({
    types,
    prepareOldSnapshot,
    performUpdate,
    prepareNewSnapshot,
    onFinished,
  }: TransitionRequest) {
    if (this.#activeViewTransition) {
      this.skipTransitions();
    }

    if (!this.isSupported()) {
      await performUpdate(AbortSignal.timeout(10_000));
      onFinished?.();
      return;
    }

    prepareOldSnapshot?.();
    await tick();

    const abortController = new AbortController();
    let transition: ViewTransition;
    try {
      // eslint-disable-next-line tscompat/tscompat
      transition = document.startViewTransition({
        update: async () => {
          await performUpdate(abortController.signal);
          prepareNewSnapshot?.();
          await tick();
        },
        types,
      });
    } catch {
      // eslint-disable-next-line tscompat/tscompat
      transition = document.startViewTransition(async () => {
        await performUpdate(abortController.signal);
        prepareNewSnapshot?.();
        await tick();
      });
    }

    this.#activeViewTransition = transition;
    this.#activeOnFinished = onFinished;

    // eslint-disable-next-line tscompat/tscompat
    void transition.ready.catch((error: unknown) => {
      abortController.abort(error);
    });

    // Let animation run in the background — don't block the caller.
    // This allows skipTransitions() to abort mid-animation for rapid navigation.
    // eslint-disable-next-line tscompat/tscompat
    void transition.finished
      .catch(() => {})
      .finally(() => {
        if (this.#activeViewTransition === transition) {
          this.#activeViewTransition = null;
          this.#activeOnFinished = undefined;
          onFinished?.();
        }
      });

    // Wait only until the DOM update completes (both snapshots captured),
    // not for the animation to finish.
    // eslint-disable-next-line tscompat/tscompat
    await transition.updateCallbackDone;
  }
}

export const viewTransitionManager = new ViewTransitionManager();
