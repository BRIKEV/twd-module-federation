import React from 'react';
import { subscribe, getState, increment, instanceId } from '@poc/bus';
import type { BusSnapshot } from '@poc/bus';

interface Props {
  /** Passed in by the host through mount(), not through React context. */
  hostLabel?: string;
}

type State = BusSnapshot & { greeting: string };

/**
 * This microfrontend owns /api/legacy/* and nothing else touches it, so this
 * team mocks it in their own TWD tests without coordinating with anyone.
 */
const FALLBACK_GREETING = 'api offline';

/**
 * A deliberately old-fashioned React component: a class, `this.setState`, and
 * manual subscribe/unsubscribe in lifecycle methods. No hooks, because this
 * remote is pinned to React 17 and has its own React instance — the host's
 * hooks and context are unreachable from in here.
 *
 * Note it still talks to the same @poc/bus as the other two microfrontends.
 * That's the whole trick: share plain state, not framework objects.
 */
export default class LegacyWidget extends React.Component<Props, State> {
  private unsubscribe?: () => void;
  private mounted = false;

  constructor(props: Props) {
    super(props);
    this.state = { ...getState(), greeting: FALLBACK_GREETING };
    this.handleClick = this.handleClick.bind(this);
    this.loadGreeting = this.loadGreeting.bind(this);
  }

  componentDidMount() {
    this.mounted = true;
    this.unsubscribe = subscribe((snapshot) => this.setState(snapshot));
    void this.loadGreeting();
  }

  async loadGreeting() {
    try {
      const res = await fetch('/api/legacy/greeting');
      if (!res.ok) {
        if (this.mounted) this.setState({ greeting: FALLBACK_GREETING });
        return;
      }
      const data = await res.json();
      if (this.mounted) this.setState({ greeting: data?.message ?? FALLBACK_GREETING });
    } catch {
      // Fall back rather than keeping a stale greeting — a reload that failed
      // should say so, not leave the last good value on screen.
      if (this.mounted) this.setState({ greeting: FALLBACK_GREETING });
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    this.unsubscribe?.();
  }

  handleClick() {
    increment('Legacy React');
  }

  render() {
    const { count, lastSource, greeting } = this.state;

    return (
      <section className="mfe-card mfe-card--legacy">
        <header className="mfe-card__head">
          <h2 className="mfe-card__title">Legacy React</h2>
          <span className="mfe-card__badge">react {React.version}</span>
        </header>

        <p className="mfe-card__contract">
          <strong>Contract B</strong> — own React instance, mounted by the host
          via <code>ReactDOM.render</code>. Class component,{' '}
          <code>this.setState</code>, no hooks.
        </p>

        <div className="mfe-card__counter">
          {/* See the note in mfe-react-modern/src/Widget.tsx — <output> gives
              an implicit role="status" so tests need no test id. */}
          <output className="mfe-card__count">{count}</output>
          <button
            type="button"
            className="mfe-card__button"
            onClick={this.handleClick}
          >
            +1
          </button>
        </div>

        <dl className="mfe-card__meta">
          <div>
            <dt>last touched by</dt>
            <dd>{lastSource}</dd>
          </div>
          <div>
            <dt>bus instance</dt>
            <dd>{instanceId}</dd>
          </div>
          <div>
            <dt>greeting</dt>
            <dd>
              <span>{greeting}</span>
              <button
                type="button"
                className="mfe-card__refresh"
                aria-label="Reload greeting"
                onClick={this.loadGreeting}
              >
                ↻
              </button>
            </dd>
          </div>
          {this.props.hostLabel ? (
            <div>
              <dt>mounted by</dt>
              <dd>{this.props.hostLabel}</dd>
            </div>
          ) : null}
        </dl>
      </section>
    );
  }
}
