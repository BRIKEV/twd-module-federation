<script setup lang="ts">
import { onMounted, onUnmounted, ref, version } from 'vue';
import { subscribe, getState, increment, instanceId } from '@poc/bus';

defineProps<{ hostLabel?: string }>();

// This microfrontend owns /api/vue/* and nothing else touches it, so this team
// mocks it in their own TWD tests without coordinating with anyone.
const FALLBACK_GREETING = 'api offline';

const snapshot = ref(getState());
const greeting = ref(FALLBACK_GREETING);
let unsubscribe: (() => void) | undefined;

// The bus is a plain callback store, so bridging it into Vue reactivity is
// three lines. The same store is driving a React 19 useSyncExternalStore and a
// React 17 setState elsewhere on this page.
async function loadGreeting() {
  try {
    const res = await fetch('/api/vue/greeting');
    if (!res.ok) {
      greeting.value = FALLBACK_GREETING;
      return;
    }
    const data = await res.json();
    greeting.value = data?.message ?? FALLBACK_GREETING;
  } catch {
    // Fall back rather than keeping a stale greeting — a reload that failed
    // should say so, not leave the last good value on screen.
    greeting.value = FALLBACK_GREETING;
  }
}

onMounted(() => {
  unsubscribe = subscribe((next) => {
    snapshot.value = next;
  });
  void loadGreeting();
});

onUnmounted(() => {
  unsubscribe?.();
});
</script>

<template>
  <section class="mfe-card mfe-card--vue">
    <header class="mfe-card__head">
      <h2 class="mfe-card__title">Vue</h2>
      <span class="mfe-card__badge">vue {{ version }}</span>
    </header>

    <p class="mfe-card__contract">
      <strong>Contract B</strong> — own Vue runtime, mounted by the host via
      <code>createApp</code>. The host never sees a Vue component.
    </p>

    <div class="mfe-card__counter">
      <!-- See the note in mfe-react-modern/src/Widget.tsx — <output> gives an
           implicit role="status" so tests need no test id. -->
      <output class="mfe-card__count">{{ snapshot.count }}</output>
      <button type="button" class="mfe-card__button" @click="increment('Vue')">
        +1
      </button>
    </div>

    <dl class="mfe-card__meta">
      <div>
        <dt>last touched by</dt>
        <dd>{{ snapshot.lastSource }}</dd>
      </div>
      <div>
        <dt>bus instance</dt>
        <dd>{{ instanceId }}</dd>
      </div>
      <div>
        <dt>greeting</dt>
        <dd>
          <span>{{ greeting }}</span>
          <button
            type="button"
            class="mfe-card__refresh"
            aria-label="Reload greeting"
            @click="loadGreeting"
          >
            ↻
          </button>
        </dd>
      </div>
      <div v-if="hostLabel">
        <dt>mounted by</dt>
        <dd>{{ hostLabel }}</dd>
      </div>
    </dl>
  </section>
</template>
