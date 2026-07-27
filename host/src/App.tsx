import React, { lazy, Suspense, useSyncExternalStore } from 'react';
import { subscribe, getState, reset, instanceId } from '@poc/bus';
import RemoteOutlet from './RemoteOutlet';
import ErrorBoundary from './ErrorBoundary';
import './app.css';

// Contract A. A federated React component behaves exactly like a local one,
// Suspense included — but only because this remote shares the host's React.
const ModernWidget = lazy(() => import('mfe_react_modern/Widget'));

function Loading({ name }: { name: string }) {
  return <div className="outlet-loading">Loading {name}…</div>;
}

export default function App() {
  const snapshot = useSyncExternalStore(subscribe, getState);

  return (
    <div className="page">
      <header className="page__head">
        <h1 className="page__title">Three microfrontends, one page</h1>
        <p className="page__lede">
          A React {React.version} host composing a Vue 3 remote, a React 17
          remote using the pre-18 API, and a React 19 remote — each built and
          served independently.
        </p>
      </header>

      <section className="statusbar">
        <div className="statusbar__item">
          <span className="statusbar__label">shared count</span>
          <span className="statusbar__value statusbar__value--big">
            {snapshot.count}
          </span>
        </div>
        <div className="statusbar__item">
          <span className="statusbar__label">last touched by</span>
          <span className="statusbar__value">{snapshot.lastSource}</span>
        </div>
        <div className="statusbar__item">
          <span className="statusbar__label">host bus instance</span>
          <span className="statusbar__value">{instanceId}</span>
        </div>
        <button
          type="button"
          className="statusbar__reset"
          onClick={() => reset('Host')}
        >
          reset
        </button>
      </section>

      <main className="grid">
        <ErrorBoundary name="Modern React remote">
          <Suspense fallback={<Loading name="modern React remote" />}>
            <ModernWidget />
          </Suspense>
        </ErrorBoundary>

        <RemoteOutlet
          name="Legacy React remote"
          load={() => import('mfe_react_legacy/mount')}
          props={{ hostLabel: 'host (React 19)' }}
        />

        <RemoteOutlet
          name="Vue remote"
          load={() => import('mfe_vue/mount')}
          props={{ hostLabel: 'host (React 19)' }}
        />
      </main>

      <footer className="page__foot">
        <p>
          <strong>What to look at.</strong> Click <code>+1</code> in any card —
          all three update, plus the bar above. Three renderers on three
          framework versions, one store.
        </p>
        <p>
          The <em>bus instance</em> id is identical in all four places. That's
          the proof <code>@poc/bus</code> resolved to a single shared module
          rather than four bundled copies.
        </p>
        <p>
          The two React cards report different <code>react</code> versions,
          because they genuinely are two React instances on this page. That is
          the point, not a bug — see{' '}
          <code>mfe-react-legacy/module-federation.config.ts</code>.
        </p>
      </footer>
    </div>
  );
}
