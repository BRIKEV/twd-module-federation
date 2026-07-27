<script setup lang="ts">
import { onMounted, onUnmounted, ref, version } from 'vue';
import { subscribe, getState, increment, instanceId } from '@poc/bus';

defineProps<{ hostLabel?: string }>();

const snapshot = ref(getState());
let unsubscribe: (() => void) | undefined;

// The bus is a plain callback store, so bridging it into Vue reactivity is
// three lines. The same store is driving a React 19 useSyncExternalStore and a
// React 17 setState elsewhere on this page.
onMounted(() => {
  unsubscribe = subscribe((next) => {
    snapshot.value = next;
  });
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
      <span class="mfe-card__count">{{ snapshot.count }}</span>
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
      <div v-if="hostLabel">
        <dt>mounted by</dt>
        <dd>{{ hostLabel }}</dd>
      </div>
    </dl>
  </section>
</template>
