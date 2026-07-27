import { createModuleFederationConfig } from '@module-federation/rsbuild-plugin';

export default createModuleFederationConfig({
  name: 'mfe_react_legacy',

  // A fixed, unhashed container filename, so the host can point straight at
  // it. See the note in host/module-federation.config.ts for why this matters
  // more than it looks.
  filename: 'remoteEntry.js',

  // Contract B: expose a mount/unmount pair, NOT a component.
  //
  // The host runs React 19. This remote runs React 17. There is no shared
  // React instance between them, so a React element created here would be
  // meaningless to the host's renderer. Instead the host hands over a bare
  // DOM node and this remote renders into it with its own ReactDOM.
  exposes: {
    './mount': './src/mount.tsx',
  },

  shared: {
    // The important line in this whole repo.
    //
    // `singleton: false` + a ^17 range means: look in the share scope for a
    // React that satisfies ^17; the host only offers 19, which doesn't, so
    // fall back to the copy bundled here. Two Reacts end up on the page and
    // that is correct — each one owns a disjoint DOM subtree.
    //
    // Setting `singleton: true` here is the classic mistake. It would hand
    // this React-17 code the host's React 19 and blow up at render time.
    react: { singleton: false, requiredVersion: '^17.0.0' },
    'react-dom': { singleton: false, requiredVersion: '^17.0.0' },

    // The store has no framework coupling, so it *can* be a true singleton
    // even though React can't.
    '@poc/bus': { singleton: true },
  },
});
