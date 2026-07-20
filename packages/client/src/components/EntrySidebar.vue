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

import type { Entry } from "../api";

defineProps<{
  entries: Entry[];
  selectedId: string | null;
}>();

const emit = defineEmits<{
  select: [id: string];
  create: [];
}>();
</script>

<template>
  <Sidebar>
    <Button variant="accent" @click="emit('create')">
      <Icon :icon="Plus" />
      New entry
    </Button>
    <ListGroup>
      <ListGroupItem
        v-for="entry in entries"
        :key="entry.id"
        :active="entry.id === selectedId"
        @click="emit('select', entry.id)"
      >
        {{ entry.name }}
      </ListGroupItem>
    </ListGroup>
    <template #footer>
      <ThemeToggle />
    </template>
  </Sidebar>
</template>
