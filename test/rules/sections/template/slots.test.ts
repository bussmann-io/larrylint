import rule from '../../../../src/rules/sections/template/slots'
import { runtime, vueTester } from '../../../utils'

const filename = runtime('app/components/Container.vue')

vueTester.run('slot-children', rule, {
  valid: [
    { filename, code: `<script setup lang="ts">\nconst slots = useSlots()\nconst hasContent = computed(() => Boolean(slots.default?.()))\n</script>` },
    { filename, code: `<script setup lang="ts">\nconst count = computed(() => props.items.length)\n</script>` },
  ],

  invalid: [
    { filename, code: `<script setup lang="ts">\nconst slots = useSlots()\nconst loop = computed(() => (slots.default?.()?.length ?? 0) > 1)\n</script>`, errors: [{ messageId: 'length', line: 3 }] },
    { filename, code: `<script setup lang="ts">\nconst container = useSlots()\nconst many = container.default().length > 1\n</script>`, errors: [{ messageId: 'length' }] },
    { filename, code: `<template><div :class="{ grid: $slots.default().length > 1 }"><slot /></div></template>`, errors: [{ messageId: 'length' }] },
  ],
})
