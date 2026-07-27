import React from 'react';

interface Props {
  name: string;
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Contract A has no try/catch equivalent — a federated React component that
 * throws during render will take the host's tree down with it. An error
 * boundary per remote is the containment story, and it's the main operational
 * cost of exposing components instead of mount functions.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <section className="outlet-error">
          <h2 className="outlet-error__title">
            {this.props.name} failed to load
          </h2>
          <p className="outlet-error__body">{error.message}</p>
          <p className="outlet-error__hint">
            Is its dev server running? One dead remote does not take the page
            down with it.
          </p>
        </section>
      );
    }
    return this.props.children;
  }
}
