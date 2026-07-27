/**
 * A framework-agnostic store shared across every microfrontend.
 *
 * This package is the *only* thing all four apps share as a true singleton.
 * React can't be (the host is on 19, one remote is on 17), and Vue has no
 * reason to be. Because this module imports nothing, it has no version
 * conflict to resolve, so Module Federation can hand every consumer the exact
 * same instance.
 *
 * If `instanceId` renders identically in all three microfrontends, the
 * singleton worked. If you see three different ids, someone's `shared` config
 * is wrong and each remote bundled its own copy.
 */

/** Random per module *instance*, so it doubles as a singleton assertion. */
export const instanceId = Math.random().toString(36).slice(2, 8);

/**
 * The current snapshot, replaced wholesale on every change.
 *
 * Storing it rather than rebuilding it on each read matters: React 19's
 * `useSyncExternalStore` compares snapshots with `Object.is`, so a getState()
 * that returned a fresh object every call would look like a change on every
 * render and spin into "Maximum update depth exceeded". Same object identity
 * until something actually changes.
 */
let snapshot = {
  count: 0,
  lastSource: 'nobody yet',
};

const listeners = new Set();

function commit(next) {
  snapshot = next;
  for (const listener of listeners) listener(snapshot);
}

/** @returns {{count: number, lastSource: string}} stable until the next change */
export function getState() {
  return snapshot;
}

/**
 * @param {string} source label of the microfrontend making the change
 * @param {number} [by]
 */
export function increment(source, by = 1) {
  commit({ count: snapshot.count + by, lastSource: source });
}

/** @param {string} source */
export function reset(source) {
  commit({ count: 0, lastSource: source });
}

/**
 * Subscribe to changes. Fires immediately with the current snapshot so
 * subscribers never render a stale zero.
 *
 * @param {(snapshot: {count: number, lastSource: string}) => void} listener
 * @returns {() => void} unsubscribe
 */
export function subscribe(listener) {
  listeners.add(listener);
  listener(getState());
  return () => {
    listeners.delete(listener);
  };
}
