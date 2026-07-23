<script setup lang="ts">
import { Moon, Sun } from "lucide-vue-next";

import { useTheme } from "../composables/useTheme";
import Clickable from "./Clickable.vue";
import Icon from "./Icon.vue";

const { theme, toggleTheme } = useTheme();
</script>

<template>
  <Clickable class="theme-toggle" @click="toggleTheme">
    <Icon :icon="theme === 'dark' ? Sun : Moon" />
    {{ theme === "dark" ? "Light mode" : "Dark mode" }}
  </Clickable>
</template>

<style scoped>
.theme-toggle {
  width: 100%;
  justify-content: center;
  padding: 0.5rem 0.9rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface-raised);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 0.8125rem;
}
.theme-toggle:hover {
  border-color: var(--color-accent);
  color: var(--color-accent-strong);
}
</style>
