<script setup lang="ts">
import { onMounted } from "vue";

import AppSidebar from "./components/AppSidebar.vue";
import { useEntries } from "./composables/useEntries";

const { loadEntries } = useEntries();
onMounted(loadEntries);
</script>

<template>
  <div class="app-shell">
    <AppSidebar />
    <main class="main-area">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
}
.main-area {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
