import React from 'react';
import { subscribe, getState, increment, instanceId } from '@poc/bus';
import type { BusSnapshot } from '@poc/bus';

interface Props {
  /** Passed in by the host through mount(), not through React context. */
  hostLabel?: string;
}

type State = BusSnapshot;

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

  constructor(props: Props) {
    super(props);
    this.state = getState();
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    this.unsubscribe = subscribe((snapshot) => this.setState(snapshot));
  }

  componentWillUnmount() {
    this.unsubscribe?.();
  }

  handleClick() {
    increment('Legacy React');
  }

  render() {
    const { count, lastSource } = this.state;

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
          <span className="mfe-card__count">{count}</span>
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
