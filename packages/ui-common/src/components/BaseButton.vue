<script setup lang="ts">
// Attrs (including click listeners) fall through to the native button.
</script>

<template>
  <button class="base-button" type="button">
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  padding: 0.5rem 1rem;
  border: 1px solid #444;
  border-radius: 6px;
  background: transparent;
  font: inherit;
  cursor: pointer;
}
.base-button:hover {
  background: rgba(127, 127, 127, 0.15);
}
</style>
