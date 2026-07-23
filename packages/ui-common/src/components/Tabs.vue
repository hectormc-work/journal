<script setup lang="ts">
defineProps<{ tabs: Array<{ id: string; label: string }> }>();
const active = defineModel<string>({ required: true });
</script>

<template>
  <div class="tabs">
    <div class="tab-list" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        class="tab"
        :class="{ active: tab.id === active }"
        :aria-selected="tab.id === active"
        @click="active = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tab-content">
      <slot :name="active" />
    </div>
  </div>
</template>

<style scoped lang="scss">
// Manila-folder tabs: rounded top corners, and a flared base where the tab
// meets the content box below -- radial-gradient notches at the bottom
// corners, cut from the active tab's own background color, curving the
// transition outward instead of a hard right angle.
//
// $flare must equal tab-list's own horizontal padding: the leftmost/
// rightmost tab's flare notch extends exactly to the tab-list's edge, which
// is also the content box's edge -- anything less leaves a gap where the
// flare's curve ends short of the border it's supposed to meet.
$flare: 1rem;

.tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.tab-list {
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
  padding: 1.5rem $flare 0;
  position: relative;
  // Overlaps 1px into the content box's top border below -- same background
  // and border color, so the seam disappears and the two elements read as
  // one continuous bordered shape instead of two boxes stacked with a
  // doubled-up or broken border between them.
  z-index: 1;
  margin-bottom: -1px;
}

.tab {
  position: relative;
  padding: 0.6rem 1.3rem;
  border: none;
  background: transparent;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  cursor: pointer;
  font: inherit;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  color: var(--color-text-muted);

  &:hover {
    color: var(--color-text);
  }

  &.active {
    background: var(--color-surface);
    color: var(--color-text);
    font-weight: 600;
    border: 1px solid var(--color-border);
    border-bottom: none;
  }

  &.active::before,
  &.active::after {
    content: "";
    position: absolute;
    bottom: 0;
    width: $flare;
    height: $flare;
  }

  // Each notch traces the same curve twice: a 1px ring in the border color,
  // then the fill color beyond it -- so the border wraps the flare instead
  // of stopping dead at the tab's straight edges.
  &.active::before {
    left: -$flare;
    background: radial-gradient(
      circle at top left,
      transparent $flare,
      var(--color-border) $flare,
      var(--color-border) calc(#{$flare} + 1px),
      var(--color-surface) calc(#{$flare} + 1px)
    );
  }

  &.active::after {
    right: -$flare;
    background: radial-gradient(
      circle at top right,
      transparent $flare,
      var(--color-border) $flare,
      var(--color-border) calc(#{$flare} + 1px),
      var(--color-surface) calc(#{$flare} + 1px)
    );
  }
}

.tab-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
</style>
