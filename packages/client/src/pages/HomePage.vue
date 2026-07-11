<script setup lang="ts">
import { onMounted, ref } from "vue";

import { healthSchema, type Health } from "@journal/common";
import { BaseButton } from "@journal/ui-common";

import { api } from "../api";

const health = ref<Health | null>(null);
const error = ref<string | null>(null);

// Exercises the whole chain: zod schema from common, typed RPC call against
// the server's AppType, shared component from ui-common.
async function ping() {
  error.value = null;
  try {
    const res = await api.api.health.$get();
    health.value = healthSchema.parse(await res.json());
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

onMounted(ping);
</script>

<template>
  <main>
    <h1>Journal</h1>
    <p v-if="health">API is {{ health.status }} — {{ health.time }}</p>
    <p v-else-if="error">API unreachable: {{ error }}</p>
    <p v-else>Checking API…</p>
    <BaseButton @click="ping">Ping again</BaseButton>
  </main>
</template>
