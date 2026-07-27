import React, { useSyncExternalStore } from 'react';
import { subscribe, getState, increment, instanceId } from '@poc/bus';
import './widget.css';

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
        <span className="mfe-card__count">{snapshot.count}</span>
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
      </dl>
    </section>
  );
}
