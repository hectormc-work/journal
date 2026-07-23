import { ref, watchEffect } from "vue";

type Theme = "light" | "dark";

const STORAGE_KEY = "journal-theme";

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readStoredTheme(): Theme | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

// Module-level singleton: one theme for the whole app, no provide/inject needed.
const theme = ref<Theme>(
  readStoredTheme() ?? (systemPrefersDark() ? "dark" : "light"),
);

watchEffect(() => {
  document.documentElement.setAttribute("data-theme", theme.value);
  localStorage.setItem(STORAGE_KEY, theme.value);
});

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === "dark" ? "light" : "dark";
  }

  return { theme, toggleTheme };
}
