<script setup lang="ts">
// A bare interactive reset — no border/background/padding of its own.
// For anything that wants a click target styled from scratch (icon-only
// triggers, custom-shaped controls) rather than Button's boxed look.
// Attrs (including click listeners) fall through to the native button.
</script>

<template>
  <button class="clickable" type="button">
    <slot />
  </button>
</template>

<style scoped>
.clickable {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
</style>