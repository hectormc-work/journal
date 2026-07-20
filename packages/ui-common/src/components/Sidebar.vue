<script setup lang="ts">
withDefaults(defineProps<{ width?: string }>(), { width: "260px" });
</script>

<template>
  <aside class="sidebar" :style="{ width }">
    <div class="sidebar-content">
      <slot />
    </div>
    <div v-if="$slots.footer" class="sidebar-footer">
      <slot name="footer" />
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  flex-shrink: 0;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  font-family: var(--font-sans);
}
.sidebar-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.sidebar-footer {
  flex-shrink: 0;
  padding: 1rem;
  border-top: 1px solid var(--color-border);
}
</style>
