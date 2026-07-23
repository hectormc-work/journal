<template>
  <p class="alert">
    <slot />
  </p>
</template>

<style scoped>
.alert {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  color: var(--color-danger);
  background: color-mix(in srgb, var(--color-danger) 16%, var(--color-surface));
  border: 1px solid color-mix(in srgb, var(--color-danger) 40%, transparent);
  padding: 0.6rem 0.9rem;
  border-radius: var(--radius-sm);
}
</style>
