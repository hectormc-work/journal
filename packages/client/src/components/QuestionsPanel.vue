<script setup lang="ts">
// Placeholder for Phase 4 — will show the entry's attached prompt_response
// rows (grouped by the prompt_group that was added), each independently
// answerable. No backend for this yet.
</script>

<template>
  <section class="questions-panel">
    <h2>Questions</h2>
    <p class="placeholder">Coming soon.</p>
  </section>
</template>

<style scoped>
.questions-panel {
  height: 100%;
  padding: 1.5rem;
  box-sizing: border-box;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
}
.questions-panel h2 {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  margin: 0 0 0.5rem;
  color: var(--color-text);
}
.placeholder {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
</style>
