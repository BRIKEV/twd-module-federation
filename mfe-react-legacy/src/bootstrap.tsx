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
