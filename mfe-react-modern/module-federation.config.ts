import { createModuleFederationConfig } from '@module-federation/rsbuild-plugin';

export default createModuleFederationConfig({
  name: 'mfe_react_modern',

  // A fixed, unhashed container filename, so the host can point straight at
  // it. See the note in host/module-federation.config.ts for why this matters
  // more than it looks.
  filename: 'remoteEntry.js',

  // Contract A: expose a real React component.
  //
  // This is only safe because this remote and the host run the same major of
  // React and share one instance. Hooks, context and Suspense all survive the
  // boundary, so the host can `React.lazy()` this directly.
  exposes: {
    './Widget': './src/Widget.tsx',
  },

  shared: {
    // Same React instance as the host. Both on 19, so this is safe.
    react: { singleton: true },
    'react-dom': { singleton: true },
    // The cross-framework store. Singleton everywhere.
    '@poc/bus': { singleton: true },
  },
});
