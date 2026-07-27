export interface BusSnapshot {
  count: number;
  lastSource: string;
}

/** Random per module instance — use it to prove the singleton is real. */
export declare const instanceId: string;

export declare function getState(): BusSnapshot;

export declare function increment(source: string, by?: number): void;

export declare function reset(source: string): void;

/** Fires immediately with the current snapshot. Returns an unsubscribe fn. */
export declare function subscribe(listener: (snapshot: BusSnapshot) => void): () => void;
