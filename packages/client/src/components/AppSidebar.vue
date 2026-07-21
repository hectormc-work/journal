<script setup lang="ts">
import {
  Button,
  Icon,
  ListGroup,
  ListGroupItem,
  Sidebar,
  ThemeToggle,
} from "@journal/ui-common";
import { Plus } from "lucide-vue-next";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useEntries } from "../composables/useEntries";

const { entries } = useEntries();
const route = useRoute();
const router = useRouter();

// route.params.id is string | string[] in general (repeated-segment routes);
// this app never has that, but the type doesn't know it.
const activeId = computed(() => {
  const id = route.params.id;
  return Array.isArray(id) ? id[0] : id;
});
</script>

<template>
  <Sidebar>
    <Button variant="accent" @click="router.push('/entries/new')">
      <Icon :icon="Plus" />
      New entry
    </Button>
    <ListGroup>
      <ListGroupItem
        v-for="entry in entries"
        :key="entry.id"
        :active="entry.id === activeId"
        @click="router.push(`/entries/${entry.id}`)"
      >
        {{ entry.name }}
      </ListGroupItem>
    </ListGroup>
    <template #footer>
      <ThemeToggle />
    </template>
  </Sidebar>
</template>
