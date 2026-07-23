<template>
  <ul class="list-group">
    <slot />
  </ul>
</template>

<style scoped>
.list-group {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  text-align: left;
}
</style>
