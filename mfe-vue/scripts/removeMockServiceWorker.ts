import fs from 'node:fs';
import path from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';

/**
 * Strips TWD's mock service worker from the production build.
 *
 * `mock-sw.js` lives in `public/` so the dev server can serve it from the
 * origin root — browsers only register same-origin service workers, so it has
 * to sit there. But `public/` is copied verbatim into `dist/`, which would
 * publish a request-interception worker to production.
 *
 * twd-js ships `removeMockServiceWorker` for this, but only as a Vite plugin.
 * There is no Rspack/Rsbuild equivalent, so each remote carries this ~10-line
 * copy. A bundler-agnostic version belongs upstream in twd-js — see
 * specs/2026-07-27-module-federation-design.md in the twd repo.
 */
export const removeMockServiceWorker = (): RsbuildPlugin => ({
  name: 'twd-remove-mock-service-worker',
  setup(api) {
    api.onAfterBuild(() => {
      const swPath = path.join(api.context.distPath, 'mock-sw.js');
      if (fs.existsSync(swPath)) {
        fs.rmSync(swPath);
        console.log('[twd] removed mock-sw.js from the production build');
      }
    });
  },
});
