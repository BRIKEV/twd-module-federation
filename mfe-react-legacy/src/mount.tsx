import React from 'react';
import ReactDOM from 'react-dom';
import LegacyWidget from './LegacyWidget';
import './widget.css';

export interface MountProps {
  hostLabel?: string;
}

/**
 * The framework-agnostic entry point the host actually calls.
 *
 * Everything React about this remote stops at this function. The host sees a
 * plain `(element, props) => cleanup` signature — the same signature mfe-vue
 * exposes — and never touches React 17.
 *
 * `ReactDOM.render` and `unmountComponentAtNode` were removed in React 18, so
 * this file literally could not be written against the host's React 19. That
 * is why the boundary has to be a DOM node rather than a component.
 */
export function mount(el: HTMLElement, props: MountProps = {}): () => void {
  ReactDOM.render(<LegacyWidget {...props} />, el);

  return () => {
    ReactDOM.unmountComponentAtNode(el);
  };
}
