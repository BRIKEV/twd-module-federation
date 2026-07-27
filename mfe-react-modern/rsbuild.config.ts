import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import moduleFederationConfig from './module-federation.config';

const PORT = 3001;
const ORIGIN = `http://localhost:${PORT}`;

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation(moduleFederationConfig),
  ],
  server: {
    port: PORT,
    // The host is a different origin, so it needs permission to fetch this
    // remote's manifest and chunks.
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  // Chunks must resolve against *this* remote's origin, not the host's.
  dev: { assetPrefix: ORIGIN },
  output: { assetPrefix: ORIGIN },
});
