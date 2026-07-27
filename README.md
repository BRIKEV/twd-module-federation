# Module Federation POC — Vue 3 + legacy React 17 + React 19 on one page

A React 19 host composing three independently built microfrontends:

| App | Port | Stack | Federation contract |
|---|---|---|---|
| `host/` | 3000 | React 19 | — (shell) |
| `mfe-react-modern/` | 3001 | React 19 | **A** — exposes a React component |
| `mfe-react-legacy/` | 3002 | React 17, pre-18 API | **B** — exposes `mount`/`unmount` |
| `mfe-vue/` | 3003 | Vue 3 | **B** — exposes `mount`/`unmount` |
| `packages/bus/` | — | plain ESM, zero deps | shared singleton store |

Built with Rsbuild + `@module-federation/rsbuild-plugin`. Each app is a separate
npm workspace with its own `node_modules`, so React 17 and React 19 genuinely
coexist rather than being faked.

```bash
npm install
npm run dev      # all four, http://localhost:3000
```

Each remote also runs on its own (`http://localhost:3001` … `3003`) with no host.

`npm run build` builds all four; `npm run preview` serves the built output on
the same ports.

## The one idea

`shared: { react: { singleton: true } }` is the default advice, and it is wrong
the moment two microfrontends disagree about React's major version. A React 19
host cannot hand its React to a React 17 remote.

So the sharing contract is chosen **per remote**, not once for the page:

**Contract A — expose a React component.** Only for remotes that share the
host's React instance. `mfe-react-modern` is on React 19 like the host, so the
host does `React.lazy(() => import('mfe_react_modern/Widget'))` and hooks,
context and Suspense all cross the boundary intact.

**Contract B — expose `mount(el, props) => unmount`.** For everything else. The
host hands over a bare `<div>` and the remote renders into it with its own
runtime:

```ts
// identical signature in mfe-vue and mfe-react-legacy
export function mount(el: HTMLElement, props: Props): () => void;
```

`host/src/RemoteOutlet.tsx` drives this in one small component with no
framework-specific code in it — which is why the same 60 lines mount both Vue 3
and React 17. React sees an empty leaf node and never reconciles inside it.

Two React copies end up on the page. That is correct, not a leak: each owns a
disjoint DOM subtree, and no React value ever crosses the boundary.

## Cross-framework state

`@poc/bus` is a ~40-line callback store with no framework dependency, which is
exactly why it *can* be a true singleton when React can't. All four apps declare
it `singleton: true` and get the same module instance.

Each card renders a `bus instance` id, randomised per module instance. All four
showing the same id is the proof the singleton resolved. Three different ids
would mean someone's `shared` config is wrong.

Consumption is idiomatic per framework — `useSyncExternalStore` in React 19,
`this.setState` in the React 17 class, `ref` + `onMounted` in Vue — over one
shared store.

## Three things that bit us

These cost real debugging time and are the most reusable part of this repo.

**1. `getState()` must return a referentially stable snapshot.** React 19's
`useSyncExternalStore` compares snapshots with `Object.is`. A `getState()` that
built a fresh object per call looked like a change on every render and produced
`Maximum update depth exceeded`. Fix: store the snapshot, replace it wholesale
on change. See `packages/bus/src/index.js`.

**2. The host must share the store `eager: true`.** `React.lazy` starts fetching
`mfe_react_modern` during the host's *first render*, before the share scope is
populated. That remote then found nothing to consume and silently fell back to
its own bundled copy of `@poc/bus` — no error, no warning, just two stores and a
counter that only half-updated. `eager: true` on the host puts the bus in the
initial chunk so remotes join an already-populated scope. Remotes stay lazy.

**3. Use `remoteEntry.js` URLs, not `mf-manifest.json`.** With manifest URLs the
federation runtime fetches *every* declared remote's manifest during host
startup. One unreachable remote meant an unhandled rejection that killed the
host before React mounted — a blank page, with the two healthy remotes taken
down by the offline one. Container URLs are fetched on first `import()`, so
failures surface where `RemoteOutlet` and `ErrorBoundary` can contain them.

Verify #3 yourself: start everything, kill the process on :3003, reload. You get
an error card where Vue was, and the other two keep working and stay in sync.

## Sharing config, per app

| | `react` / `react-dom` | `vue` | `@poc/bus` |
|---|---|---|---|
| host | `singleton: true` | — | `singleton: true, eager: true` |
| mfe-react-modern | `singleton: true` | — | `singleton: true` |
| mfe-react-legacy | `singleton: false`, `requiredVersion: '^17.0.0'` → own copy | — | `singleton: true` |
| mfe-vue | — | not shared, bundled | `singleton: true` |

Setting `singleton: true` on the legacy remote is the classic mistake: it hands
React-17 code the host's React 19 and breaks at render time.

Vue is deliberately not shared — nothing else on the page uses it, so the share
scope would add negotiation overhead for nothing. If a second Vue remote
appeared, those two would negotiate Vue independently of anything React does.

## Verified

Checked in a real browser (Puppeteer) against both `npm run dev` and the
production build behind `npm run preview`:

- all three remotes render; badges report React 19.2.8 / React 17.0.2 / Vue 3.5.40
- the two React remotes report different versions — two genuine instances
- `bus instance` id identical across host and all three remotes
- `+1` in any framework updates the other two and the host bar; host reset clears all three
- each remote runs standalone on its own port
- with :3003 killed, the other two still render, stay interactive and stay in sync

## Known gaps

- `npm audit` reports high-severity advisories, all from one transitive
  `adm-zip` pulled in by `@module-federation/dts-plugin`. Build-time only, never
  shipped to the browser.
- No tests beyond the browser checks above.
- Ports and remote URLs are hardcoded to `localhost`. A real deployment would
  inject them per environment.
