import { ref } from "vue";

import { api, type Entry } from "../api";

// Module-level singleton (same pattern as ui-common's useTheme) -- AppSidebar
// (persistent shell) and whichever page is active both need the same
// reactive entries list, so a shared ref beats prop-drilling through App.vue.
const entries = ref<Entry[]>([]);
const loaded = ref(false);

async function loadEntries() {
  entries.value = await api.entry.list();
  loaded.value = true;
}

export function useEntries() {
  return { entries, loaded, loadEntries };
}
