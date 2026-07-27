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
