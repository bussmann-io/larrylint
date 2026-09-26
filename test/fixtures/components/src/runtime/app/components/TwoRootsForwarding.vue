<script setup lang="ts">
defineOptions({ inheritAttrs: false })
</script>

<template>
  <nav v-bind="$attrs"><slot /></nav>
  <aside />
</template>
