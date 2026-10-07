# TWD Project Patterns

## Project Configuration

npm workspaces, Rsbuild/Rspack + Module Federation (non-Vite: manual `initTWD` setup).
TWD runs in each remote's **standalone** entry only — never in the host or an exposed module.

| Remote | Framework | Port | App URL | Entry point |
|---|---|---|---|---|
| `mfe-react-modern/` | React 19 | 3001 | http://localhost:3001 | `src/bootstrap.tsx` |
| `mfe-react-legacy/` | React 17 (pre-18 API) | 3002 | http://localhost:3002 | `src/bootstrap.tsx` |
| `mfe-vue/` | Vue 3 | 3003 | http://localhost:3003 | `src/bootstrap.ts` |

- **Base path**: / (each remote)
- **Dev command**: `npm run dev` (all apps) or `npm run dev -w <remote>` (one remote)
- **Default branch**: main
- **Public folder**: `<remote>/public/` — `mock-sw.js` is gitignored; generate with `npm run setup`
- **Test discovery**: `import.meta.webpackContext('./', { recursive: true, regExp: /\.twd\.test\.tsx?$/ })`
- **Runner config**: one `twd.config.json` per remote
- **Closing run**: full suite

### Runner Commands

twd-cli drives its own headless browser — only the remote's dev server has to be up.
Run from the remote's directory (or via `-w <remote>` from the root).

```bash
# Run all tests (all three remotes / one remote)
npm run test:ci
npm run test:ci -w mfe-vue

# Run specific tests by name (matches "suite > test", case-insensitive; repeatable)
cd mfe-vue && npx twd-cli run --test "increments the shared counter"

# Only the tests this branch added or changed
cd mfe-vue && npx twd-cli run --changed-since origin/main

# Record a run to video (one clip per matched test, needs ffmpeg)
cd mfe-vue && npx twd-cli run --record --test "renders on Vue 3"
```

Every run writes `.twd/report/` inside the remote: `run.json` (the result), `summary.md` and `index.html`. The folder is replaced on each run.

## Standard Imports

```typescript
import { twd, userEvent, screenDom } from "twd-js";
import { describe, it, beforeEach } from "twd-js/runner";
import { reset } from "@poc/bus";
```

## Visit Paths

Base path is `/`. Existing suites test the standalone page as booted and do not call `twd.visit`.

## Standard beforeEach

```typescript
beforeEach(() => {
  twd.clearRequestMockRules();
  // Shared store — reset it so counter assertions are deterministic.
  reset("test setup");
});
```

## Mocking

Each remote mocks only its own API prefix: `/api/modern/*`, `/api/legacy/*`, `/api/vue/*`.

## Portals and Dialogs

Use `screenDomGlobal` instead of `screenDom` for elements rendered in portals (modals, dropdowns, tooltips):

```typescript
import { screenDomGlobal } from "twd-js";
const modal = screenDomGlobal.getByRole("dialog");
```
