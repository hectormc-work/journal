<script setup lang="ts">
import type { Component } from "vue";

withDefaults(defineProps<{ icon: Component; size?: number }>(), { size: 16 });
</script>

<template>
  <component :is="icon" :size="size" :stroke-width="1.75" />
</template>