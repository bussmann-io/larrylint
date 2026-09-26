<script lang="ts">
export const definition = defineSection({
  component: 'ContactFormSection',
  studio: { label: 'Contact form', description: 'A form visitors send messages with.' },
  schema: [],
})
</script>

<template>
  <form>
    <l-button type="submit">Send</l-button>
  </form>
</template>
