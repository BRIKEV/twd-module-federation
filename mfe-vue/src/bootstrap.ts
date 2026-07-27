import { mount } from './mount';
import './standalone.css';

/**
 * Standalone harness — open http://localhost:3003 directly.
 * It calls the very same mount() the host calls, which is the cheapest way to
 * keep the standalone and federated paths from drifting apart.
 */
const rootEl = document.getElementById('root');
if (rootEl) {
  rootEl.className = 'standalone';

  const note = document.createElement('p');
  note.className = 'standalone__note';
  note.textContent = 'Running standalone on :3003 — the host is not involved.';
  rootEl.appendChild(note);

  const slot = document.createElement('div');
  rootEl.appendChild(slot);

  mount(slot, {});
}

/**
 * TWD lives in the standalone harness, never in the exposed module — see the
 * note in mfe-react-modern/src/bootstrap.tsx for why.
 *
 * twd-js has React in its peerDependencies but the bundled entry renders with
 * Preact, so this Vue app pulls in no React at all.
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
