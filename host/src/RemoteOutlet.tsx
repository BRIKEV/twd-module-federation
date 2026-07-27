import { useEffect, useRef, useState } from 'react';

interface RemoteModule {
  mount: (el: HTMLElement, props?: Record<string, unknown>) => () => void;
}

interface Props {
  /** Label used only for error reporting. */
  name: string;
  /** Dynamic import of a remote that follows the mount contract. */
  load: () => Promise<RemoteModule>;
  props?: Record<string, unknown>;
}

/**
 * The entire React ↔ anything bridge, in one component.
 *
 * It renders an empty div, hands that node to the remote's mount(), and calls
 * the returned teardown on unmount. React never reconciles anything inside the
 * div — as far as React is concerned it's an empty leaf, so the remote is free
 * to own that subtree with Vue, React 17, Svelte, or vanilla DOM.
 *
 * There is nothing framework-specific in here, which is why the same component
 * drives both the Vue remote and the legacy React one.
 */
export default function RemoteOutlet({ name, load, props }: Props) {
  const slotRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unmount: (() => void) | undefined;

    load()
      .then((mod) => {
        // StrictMode runs effects twice in dev, so the cleanup below may
        // already have fired before this resolves. Bail out rather than
        // mounting into a node the host has moved on from.
        if (cancelled || !slotRef.current) return;
        unmount = mod.mount(slotRef.current, props ?? {});
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause : new Error(String(cause)));
        }
      });

    return () => {
      cancelled = true;
      unmount?.();
    };
    // Mounted once on purpose. Re-running on a props change would tear the
    // whole microfrontend down and rebuild it; push updates through @poc/bus
    // instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <section className="outlet-error">
        <h2 className="outlet-error__title">{name} failed to load</h2>
        <p className="outlet-error__body">{error.message}</p>
        <p className="outlet-error__hint">
          Is its dev server running? One dead remote does not take the page
          down with it.
        </p>
      </section>
    );
  }

  return <div ref={slotRef} />;
}
