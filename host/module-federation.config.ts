import { createModuleFederationConfig } from '@module-federation/rsbuild-plugin';

export default createModuleFederationConfig({
  name: 'host',

  // These point at `remoteEntry.js`, not `mf-manifest.json`, and the
  // difference is load-bearing.
  //
  // With manifest URLs the federation runtime fetches every declared remote's
  // manifest during host startup, to build its snapshot. If one remote is
  // unreachable, that fetch rejects, the rejection is unhandled, and the host
  // dies before React mounts — a blank page, with the two healthy remotes
  // taken down by the one that was offline.
  //
  // A container URL is only fetched on the first `import()` of that remote, so
  // failures surface at the call site where RemoteOutlet and ErrorBoundary can
  // actually contain them. Verified: kill :3003 and the other two still work.
  remotes: {
    // Contract A — a real React component. Same React as the host.
    mfe_react_modern: 'mfe_react_modern@http://localhost:3001/remoteEntry.js',
    // Contract B — mount(el, props). Brings its own React 17.
    mfe_react_legacy: 'mfe_react_legacy@http://localhost:3002/remoteEntry.js',
    // Contract B — mount(el, props). Brings its own Vue 3.
    mfe_vue: 'mfe_vue@http://localhost:3003/remoteEntry.js',
  },

  shared: {
    // The host is the source of truth for React 19. mfe-react-modern will
    // consume this instance; mfe-react-legacy asks for ^17 and therefore
    // won't, which is exactly the intent.
    react: { singleton: true },
    'react-dom': { singleton: true },

    // Shared by all four apps with no version conflict possible, because the
    // bus has no framework dependency of its own.
    //
    // `eager: true` matters and is easy to get wrong. Without it the host
    // registers the bus into the share scope lazily, and `React.lazy` starts
    // fetching mfe_react_modern during the host's very first render — before
    // the scope is populated. That remote then finds nothing to consume and
    // silently falls back to its own bundled copy, so you get two stores and a
    // counter that only half-updates. Eager puts the bus in the host's initial
    // chunk, so every remote joins an already-populated scope.
    //
    // Only the host is eager. Remotes stay lazy so they don't each drag an
    // eager copy into their own initial chunk.
    '@poc/bus': { singleton: true, eager: true },
  },
});
