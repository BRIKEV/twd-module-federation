import { createApp } from 'vue';
import VueWidget from './VueWidget.vue';
import './widget.css';

export interface MountProps {
  hostLabel?: string;
}

/**
 * Identical signature to mfe-react-legacy's mount(). That's deliberate: the
 * host has one `RemoteOutlet` component that drives both, and it contains
 * nothing framework-specific.
 *
 * `app.unmount()` tears down the Vue app completely, so the host can unmount
 * and remount this microfrontend without leaking listeners.
 */
export function mount(el: HTMLElement, props: MountProps = {}): () => void {
  const app = createApp(VueWidget, { ...props });
  app.mount(el);

  return () => {
    app.unmount();
  };
}
