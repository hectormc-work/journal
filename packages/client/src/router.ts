import { createRouter, createWebHistory } from "vue-router";

import EntryPage from "./pages/EntryPage.vue";
import HomePage from "./pages/HomePage.vue";
import NewEntryPage from "./pages/NewEntryPage.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: HomePage },
    { path: "/entries/new", component: NewEntryPage },
    { path: "/entries/:id", component: EntryPage },
  ],
});
