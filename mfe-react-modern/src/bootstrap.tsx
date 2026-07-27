import React from 'react';
import ReactDOM from 'react-dom/client';
import Widget from './Widget';
import './standalone.css';

/**
 * Standalone harness. Every remote must run on its own so a team can develop
 * it without booting the host — open http://localhost:3001 directly.
 * The host never loads this file; it only loads the exposed `./Widget`.
 */
const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <main className="standalone">
        <p className="standalone__note">
          Running standalone on :3001 — the host is not involved.
        </p>
        <Widget />
      </main>
    </React.StrictMode>,
  );
}

/**
 * TWD lives in the standalone harness, never in the exposed module.
 *
 * Under federation all three remotes execute on the *host's* origin, and
 * `initTWD()` appends an unguarded `#twd-sidebar-root` on every call. Wiring
 * this into Widget.tsx would give the host page three sidebars with duplicate
 * DOM ids, three Preact roots, and three teams' mock rules in one service
 * worker. Per-team testing belongs here on :3001, where this microfrontend owns
 * the whole origin — including its own `/mock-sw.js` and its own `/api/modern/*`
 * mocks.
 */
if (import.meta.env.DEV) {
  void (async () => {
    // Rspack's equivalent of Vite's `import.meta.glob`.
    const ctx = import.meta.webpackContext('./', {
      recursive: true,
      regExp: /\.twd\.test\.tsx?$/,
    });
    const tests = Object.fromEntries(
      ctx.keys().map((key) => [key, () => Promise.resolve(ctx(key))]),
    );

    const { initTWD } = await import('twd-js/bundled');
    initTWD(tests, {
      open: false,
      position: 'left',
      search: true,
      serviceWorker: true,
      serviceWorkerUrl: '/mock-sw.js',
    });
  })();
}
