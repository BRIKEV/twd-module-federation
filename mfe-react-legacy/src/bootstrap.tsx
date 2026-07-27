import ReactDOM from 'react-dom';
import LegacyWidget from './LegacyWidget';
import './widget.css';
import './standalone.css';

/**
 * Standalone harness — open http://localhost:3002 directly.
 * Uses the same React 17 `ReactDOM.render` the exposed mount() uses.
 */
const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.render(
    <main className="standalone">
      <p className="standalone__note">
        Running standalone on :3002 — the host is not involved.
      </p>
      <LegacyWidget />
    </main>,
    rootEl,
  );
}

/**
 * TWD lives in the standalone harness, never in the exposed module — see the
 * note in mfe-react-modern/src/bootstrap.tsx for why.
 *
 * Worth noting that TWD renders its sidebar with Preact, so it does not care
 * that this app is on React 17. The same version of twd-js drives the React 19
 * remote next door.
 */
if (import.meta.env.DEV) {
  void (async () => {
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
