import { createModuleFederationConfig } from '@module-federation/rsbuild-plugin';

export default createModuleFederationConfig({
  name: 'mfe_vue',

  // A fixed, unhashed container filename, so the host can point straight at
  // it. See the note in host/module-federation.config.ts for why this matters
  // more than it looks.
  filename: 'remoteEntry.js',

  // Contract B again — the identical signature the legacy React remote uses.
  //
  // The host is a React app and has no idea what a Vue component is. It hands
  // over a DOM node; this remote runs its own createApp() inside it. From the
  // host's side, mounting Vue and mounting React 17 are the same call.
  exposes: {
    './mount': './src/mount.ts',
  },

  shared: {
    // Vue is deliberately NOT shared. Nothing else on the page uses it, so
    // putting it in the share scope would add negotiation overhead and buy
    // nothing. It gets bundled into this remote.
    //
    // If a second Vue microfrontend ever appeared, this is where the two would
    // agree to share one runtime — independently of anything React is doing.

    // Same store instance as both React microfrontends.
    '@poc/bus': { singleton: true },
  },
});
