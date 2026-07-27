import React, { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { subscribe, getState, increment, instanceId } from '@poc/bus';
import './widget.css';

/**
 * This microfrontend owns its own backend endpoint, and therefore its own
 * mocks. Nothing else on the page calls /api/modern/*, so this team can mock it
 * in their own TWD tests without coordinating with anyone.
 *
 * There is no server behind it in the POC — a 404 just leaves the fallback in
 * place, which is also what makes the mocked test result obvious.
 */
const FALLBACK_GREETING = 'api offline';

/**
 * The React 19 microfrontend.
 *
 * Because this remote shares one React instance with the host, it can be a
 * plain component and use whatever modern API it likes — here
 * `useSyncExternalStore`, which is the correct way to read an external store
 * in a concurrent-rendering React.
 *
 * Compare with mfe-react-legacy, which cannot do any of this.
 */
export default function Widget() {
  const snapshot = useSyncExternalStore(subscribe, getState);
  const [greeting, setGreeting] = useState(FALLBACK_GREETING);

  const loadGreeting = useCallback(async () => {
    try {
      const res = await fetch('/api/modern/greeting');
      if (!res.ok) {
        setGreeting(FALLBACK_GREETING);
        return;
      }
      const data = await res.json();
      setGreeting(data?.message ?? FALLBACK_GREETING);
    } catch {
      // Fall back rather than keeping a stale greeting — a reload that failed
      // should say so, not leave the last good value on screen.
      setGreeting(FALLBACK_GREETING);
    }
  }, []);

  useEffect(() => {
    void loadGreeting();
  }, [loadGreeting]);

  return (
    <section className="mfe-card mfe-card--modern">
      <header className="mfe-card__head">
        <h2 className="mfe-card__title">Modern React</h2>
        <span className="mfe-card__badge">react {React.version}</span>
      </header>

      <p className="mfe-card__contract">
        <strong>Contract A</strong> — exposed as a React component, shares the
        host&rsquo;s React instance. Reads the store with{' '}
        <code>useSyncExternalStore</code>.
      </p>

      <div className="mfe-card__counter">
        <span className="mfe-card__count" data-testid="modern-count">
          {snapshot.count}
        </span>
        <button
          type="button"
          className="mfe-card__button"
          onClick={() => increment('Modern React')}
        >
          +1
        </button>
      </div>

      <dl className="mfe-card__meta">
        <div>
          <dt>last touched by</dt>
          <dd>{snapshot.lastSource}</dd>
        </div>
        <div>
          <dt>bus instance</dt>
          <dd>{instanceId}</dd>
        </div>
        <div>
          <dt>greeting</dt>
          <dd>
            <span data-testid="modern-greeting">{greeting}</span>
            <button
              type="button"
              className="mfe-card__refresh"
              data-testid="modern-refresh"
              aria-label="Reload greeting"
              onClick={() => void loadGreeting()}
            >
              ↻
            </button>
          </dd>
        </div>
      </dl>
    </section>
  );
}
