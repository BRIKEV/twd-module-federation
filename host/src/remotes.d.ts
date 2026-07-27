/**
 * Hand-written types for the federated modules.
 *
 * The MF plugin can generate these into dist/@mf-types, but that requires the
 * remotes to be running before the host typechecks. Declaring the two
 * contracts by hand keeps the host buildable on its own and, more usefully,
 * puts the contracts in one readable place.
 */

/** Contract B: the framework-agnostic entry point. Returns its own teardown. */
type RemoteMountFn = (
  el: HTMLElement,
  props?: Record<string, unknown>,
) => () => void;

// Contract A — a genuine React component, because this remote shares the
// host's React instance.
declare module 'mfe_react_modern/Widget' {
  const Widget: import('react').ComponentType<Record<string, never>>;
  export default Widget;
}

// Contract B — React 17 inside, plain DOM at the boundary.
declare module 'mfe_react_legacy/mount' {
  export const mount: RemoteMountFn;
}

// Contract B — Vue 3 inside, plain DOM at the boundary. Note the type is
// identical to the legacy React one: the host cannot tell them apart.
declare module 'mfe_vue/mount' {
  export const mount: RemoteMountFn;
}
