import { PersistedLocalStorage } from '$lib/utils/persisted';
import { DateTime } from 'luxon';

class KeyboardManager {
  #enabled = new PersistedLocalStorage<boolean>('show-keys', false);
  #events = $state<Array<{ key: string; expiresAt: DateTime }>>([]);

  get keys() {
    return this.#enabled.current ? this.#events.map(({ key }) => key) : [];
  }

  toggle() {
    this.#enabled.current = !this.#enabled.current;
    if (this.#enabled) {
      this.#events = [];
    }
  }

  onTick() {
    const now = DateTime.now();
    this.#events = this.#events.filter(({ expiresAt }) => expiresAt > now);
  }

  onKeyDown(event: KeyboardEvent) {
    this.#events.push({ key: event.key, expiresAt: DateTime.now().plus({ millisecond: 1500 }) });
    this.onTick();
  }
}

export const keyboardManager = new KeyboardManager();
