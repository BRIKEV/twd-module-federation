import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import moduleFederationConfig from './module-federation.config';
import { removeMockServiceWorker } from './scripts/removeMockServiceWorker';

const PORT = 3002;
const ORIGIN = `http://localhost:${PORT}`;

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation(moduleFederationConfig),
    removeMockServiceWorker(),
  ],
  server: {
    port: PORT,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  dev: { assetPrefix: ORIGIN },
  output: { assetPrefix: ORIGIN },
});
