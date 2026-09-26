import rule from '../../../../src/rules/sections/props/fallbacks'
import { runtime, vueTester } from '../../../utils'

const filename = runtime('app/sections/SectionCards.vue')

const fields = `[{ name: 'heading', type: 'text' }, { name: 'columns', type: 'select', options: [] }, { name: 'showCta', type: 'checkbox' }, { name: 'limit', type: 'number' }]`

function component(setup: string, template = '<div />') {
  return `<script lang="ts">\nexport const definition = defineSection({ component: 'SectionCards', schema: [{ label: 'Content', fields: ${fields} }] })\n</script>\n\n<script setup lang="ts">\nconst props = defineProps(definitionToProps(definition))\n${setup}\n</script>\n\n<template>${template}</template>\n`
}

vueTester.run('dead-fallbacks', rule, {
  valid: [
    { filename, code: component(`const columns = computed(() => props.columns || '3')\nconst limit = computed(() => props.limit ?? 12)`) },
    { filename, code: component(`const hidden = computed(() => props.showCta === false)`, `<h2>{{ heading || 'Cards' }}</h2>`) },
    { filename: runtime('app/components/Cards.vue'), code: `<script setup lang="ts">\nconst props = defineProps<{ columns?: string }>()\nconst columns = computed(() => props.columns ?? '3')\n</script>` },
  ],

  invalid: [
    { filename, code: component(`const columns = computed(() => props.columns ?? '3')`), errors: [{ messageId: 'picker', data: { type: 'select', check: '??' } }] },
    { filename, code: component(`const cta = computed(() => props.showCta !== false)`), errors: [{ messageId: 'checkbox', data: { check: '!== false' } }] },
    { filename, code: component(`const cta = computed(() => props.showCta !== undefined)`), errors: [{ messageId: 'checkbox', data: { check: '!== undefined' } }] },
    { filename, code: component('', `<h2>{{ heading ?? 'Cards' }}</h2>`), errors: [{ messageId: 'text', data: { type: 'text' } }] },
    { filename, code: component('', `<Cards :columns="props.columns ?? '3'" />`), errors: [{ messageId: 'picker' }] },
  ],
})
