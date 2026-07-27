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
