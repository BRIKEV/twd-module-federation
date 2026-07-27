# TWD × Module Federation

**Three microfrontends. Three frameworks. Three teams. One page.**
Every team tests its own UI in a real browser, against its own mocks, without
blocking anybody else.

A showcase for [TWD](https://twd.dev) in the architecture it suits best: a React
19 host composing a React 19 remote, a **React 17** remote still on the pre-18
API, and a **Vue 3** remote — each built, served, tested and deployed
independently.

| App | Port | Stack | Federation contract | Tests |
|---|---|---|---|---|
| `host/` | 3000 | React 19 | — (shell) | — |
| `mfe-react-modern/` | 3001 | React 19 | **A** — exposes a React component | 4 |
| `mfe-react-legacy/` | 3002 | React 17, pre-18 API | **B** — exposes `mount`/`unmount` | 4 |
| `mfe-vue/` | 3003 | Vue 3 | **B** — exposes `mount`/`unmount` | 4 |
| `packages/bus/` | — | plain ESM, zero deps | shared singleton store | — |

## Try it

```bash
npm install
npm run setup     # twd-js init public, in all three remotes
npm run dev
```

- **http://localhost:3000** — the composed page, all three remotes together
- **http://localhost:3001** … **3003** — each remote alone, with its TWD sidebar

Then, with the dev servers running:

```bash
npm test          # twd-cli against all three remotes
npm test -w mfe-vue   # or just one team's suite
```

```
> mfe-vue@1.0.0 test
> twd-cli run

Navigating to http://localhost:3003 ...
Running 4 test(s)...

--- Run complete ---
  Passed: 4 | Failed: 0 | Skipped: 0
  Duration: 1.3s
```

Same suites, same runner, in the sidebar during development and in CI via
[`twd-cli`](https://www.npmjs.com/package/twd-cli).

## Why TWD fits this architecture

**Each team owns its own mocks.** Every remote has its own `twd-js`, its own
`mock-sw.js`, its own `twd.config.json` and its own suites. The three teams here
mock `/api/modern/*`, `/api/legacy/*` and `/api/vue/*` respectively — no shared
fixture file, no shared test repo, nothing to coordinate. A vendor can be handed
"ship a green TWD suite" as an acceptance criterion, and it runs in *their*
pipeline against *their* dev server.

**One test API across three frameworks.** These suites are near-identical
despite running against React 19 hooks, a React 17 class component and a Vue 3
SFC:

```ts
it('increments the shared counter', async () => {
  await counterReaches('0');
  await userEvent.click(await screenDom.findByRole('button', { name: '+1' }));
  await counterReaches('1');
});
```

TWD queries the DOM and the accessibility tree, so it neither knows nor cares
which framework rendered the page. No shallow rendering, no per-framework test
renderer, no adapter per stack.

**Tests survive the migration.** This is the sharpest fit. Microfrontends
usually exist because someone is strangling a legacy app one route at a time —
that React 17 remote is the legacy app. When it finally moves to React 19, its
tests don't change, because they were never coupled to React in the first place.
The scariest part of the business case gets a lot less scary when the test suite
is the thing that *survives* the rewrite.

**Real browser, real DOM, real service worker.** Two React copies genuinely
coexist on the composed page here; the mocks run through an actual service
worker. That's not something a jsdom-based runner can represent honestly.

**The same suite runs in CI.** `twd-cli` opens a headless browser, points it at
the dev server and lets TWD's in-browser runner do the work. No second test
framework, no rewriting sidebar tests into something else for the pipeline.

## Setting it up, per remote

Three steps, identical regardless of framework:

```bash
npm install twd-js twd-cli --workspace <remote>   # 1. dependencies
cd <remote> && npx twd-js init public             # 2. mock-sw.js at the origin root
```

`mock-sw.js` is **gitignored** here rather than committed, which is why step 2
is wired up as `npm run setup`. A production pipeline builds from a clean
checkout and never runs setup, so the worker can't be published — no build-time
strip needed, on any bundler. The trade-off is that every clone runs one extra
command; committing the file instead is perfectly valid, it just means you own
keeping it out of `dist/`.

```ts
// 3. src/bootstrap.tsx — the standalone entry, NOT the exposed module
if (import.meta.env.DEV) {
  void (async () => {
    // Rspack's equivalent of Vite's import.meta.glob.
    const ctx = import.meta.webpackContext('./', {
      recursive: true,
      regExp: /\.twd\.test\.tsx?$/,
    });
    const tests = Object.fromEntries(
      ctx.keys().map((key) => [key, () => Promise.resolve(ctx(key))]),
    );

    const { initTWD } = await import('twd-js/bundled');
    initTWD(tests, { serviceWorker: true, serviceWorkerUrl: '/mock-sw.js' });
  })();
}
```

Plus a `twd.config.json` pointing `twd-cli` at that remote's port:

```json
{ "url": "http://localhost:3003", "headless": true, "coverage": false }
```

Two notes. `import.meta.webpackContext` is the Rspack form — Vite's
`import.meta.glob` doesn't exist here and CRA's `require.context` isn't right
either. And TWD goes in the remote's **standalone** entry, never in the exposed
module; see [findings](#findings) for why.

## How the tests are written

Following [twd.dev/writing-tests](https://twd.dev/writing-tests): `findBy*`
first, then role → label → text → testid. There are **no test ids and no CSS
selectors** in any suite — 9 `findByRole` and 10 `findByText` across the three.

Two things make that possible:

- **The counter is an `<output>`, not a `<span>`.** It's the correct element for
  a computed value and carries an implicit `role="status"`, so it's reachable
  semantically. Where markup can't be queried accessibly, that's usually an
  accessibility bug rather than a reason for a test id.
- **The expected value goes in the query, not a following assertion.**
  `findBy*` retries, so `findByText('1', { selector: 'output' })` waits for the
  counter to *reach* 1 and can't race React's or Vue's re-render timing.

Querying buttons by accessible name has a useful side effect: the `aria-label`s
are under test. Drop the label on the `↻` button and the suite fails.

## The federation setup

`shared: { react: { singleton: true } }` is the default advice, and it's wrong
the moment two microfrontends disagree about React's major version. A React 19
host cannot hand its React to a React 17 remote. So the contract is chosen **per
remote**:

**Contract A — expose a React component.** For remotes sharing the host's React
instance. `mfe-react-modern` is on React 19 like the host, so the host does
`React.lazy(() => import('mfe_react_modern/Widget'))` and hooks, context and
Suspense cross the boundary intact.

**Contract B — expose `mount(el, props) => unmount`.** For everything else:

```ts
// identical signature in mfe-vue and mfe-react-legacy
export function mount(el: HTMLElement, props: Props): () => void;
```

`host/src/RemoteOutlet.tsx` drives this in one small component with nothing
framework-specific in it, which is why the same ~60 lines mount both Vue 3 and
React 17. Two React copies end up on the page; each owns a disjoint DOM subtree
and no React value crosses the boundary.

### Sharing config, per app

| | `react` / `react-dom` | `vue` | `@poc/bus` |
|---|---|---|---|
| host | `singleton: true` | — | `singleton: true, eager: true` |
| mfe-react-modern | `singleton: true` | — | `singleton: true` |
| mfe-react-legacy | `singleton: false`, `requiredVersion: '^17.0.0'` → own copy | — | `singleton: true` |
| mfe-vue | — | not shared, bundled | `singleton: true` |

`@poc/bus` is a ~40-line callback store with no framework dependency, which is
exactly why it *can* be a true singleton when React can't. Each card renders a
`bus instance` id; all four matching is the proof the singleton resolved.

### Three federation gotchas worth stealing

1. **`getState()` must return a referentially stable snapshot.**
   `useSyncExternalStore` compares with `Object.is`, so rebuilding the object per
   call looks like a change every render → `Maximum update depth exceeded`.
2. **The host must share the store `eager: true`.** `React.lazy` fetches a remote
   during the host's *first render*, before the share scope is populated; that
   remote silently falls back to its own bundled copy. No error — just two stores
   and a counter that half-updates.
3. **Use `remoteEntry.js` URLs, not `mf-manifest.json`.** Manifest URLs are
   fetched for every remote at host startup, so one offline remote kills the host
   before React mounts. Kill `:3003` and reload to see the contained version.

## Findings

What this POC established about TWD in a federated setup.

**TWD needs no federation awareness to work per-remote.** Install it, point it
at the origin's own `mock-sw.js`, done. Nothing in the three suites knows
federation exists. This is the headline result: the per-team story works today,
unmodified.

**It can't yet run on the composed page.** `initSidebar` appends an unguarded
`#twd-sidebar-root` on every call, and under federation all three remotes
execute on the *host's* origin — so three `initTWD()` calls would mean three
sidebars with duplicate DOM ids. Hence TWD living in each remote's standalone
entry; the host page is verified to contain no TWD at all.

Encouragingly, `window.__TWD_STATE__` and `window.__TWD_MOCK_STATE__` already
mean separate copies of twd-js on one page share a registry. The hard part is
effectively done — an idempotent `initSidebar` is the blocker.

**A reproducible race in `initTWD`.** `initTests` and `initRequestMocking` are
both fire-and-forget, so the sidebar — which `twd-cli` waits on as its readiness
signal — mounts before the service worker has claimed the page. Measured on a
cold profile: the sidebar appears at 7–12 ms, the worker takes control at
35–62 ms, and `twd-cli` starts in that gap. With the default `retryCount: 2`
it's invisible behind a green "Retried (1)"; with `retryCount: 1` the mocked
test fails **100% of runs in all three remotes**. Not federation-specific —
it reproduces in any project whose first test mocks a request. Investigation and
proposed fix: `twd-cli/docs/spec-service-worker-readiness.md`.

**One smaller gap.** Suites live in one flat registry with no namespacing, so
two teams writing `describe('App')` collide with no owner attribution — which
matters more with external vendors than it sounds, because a failure doesn't
route to anyone.

Full write-up with fixes ordered by cost: the twd repo,
`specs/2026-07-27-module-federation-design.md`.

## Verified

In a real browser, against both `npm run dev` and the production build behind
`npm run preview`:

- all three remotes render; badges report React 19.2.8 / React 17.0.2 / Vue 3.5.40
- the two React remotes report different versions — two genuine instances
- `bus instance` id identical across host and all three remotes
- `+1` in any framework updates the other two and the host bar
- each remote runs standalone on its own port
- with `:3003` killed, the other two still render and stay in sync
- 12 TWD tests green via `twd-cli`, each remote against its own mocked API
- the federated host page has no TWD sidebar, runner, state or service worker
- production bundles contain no TWD runtime

## Known gaps

- Nothing tests the *composition* — per-remote suites deliberately can't, and
  TWD can't run on the host page yet. That needs the upstream fix or a separate
  host-owned suite.
- `npm audit` reports high-severity advisories, all from one transitive
  `adm-zip` under `@module-federation/dts-plugin`. Build-time only.
- Remote URLs are hardcoded to `localhost`; a real deployment would inject them
  per environment.
