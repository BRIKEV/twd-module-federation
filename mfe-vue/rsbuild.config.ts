import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import moduleFederationConfig from './module-federation.config';
import { removeMockServiceWorker } from './scripts/removeMockServiceWorker';

const PORT = 3003;
const ORIGIN = `http://localhost:${PORT}`;

export default defineConfig({
  plugins: [
    pluginVue(),
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
