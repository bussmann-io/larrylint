import rule from '../../../../src/rules/sections/props/fallbacks'
import { fixtureRuntime, runtime, vueTester } from '../../../utils'

const filename = runtime('app/sections/SectionCards.vue')

const fields = `[
  { name: 'heading', type: 'text' },
  { name: 'intro', type: 'richtext' },
  { name: 'columns', type: 'select', options: [{ label: 'Two', value: '2' }, { label: 'Three', value: '3' }] },
  { name: 'gap', type: 'toggle_button', options: gapOptions },
  { name: 'alignment', type: 'content_alignment' },
  { name: 'showCta', type: 'checkbox' },
  { name: 'limit', type: 'number' },
]`

function component(setup: string, template = '<div />', imports = `const gapOptions = [{ label: 'S', value: 's' }, { label: 'M', value: 'm' }] as const`) {
  return `<script lang="ts">\n${imports}\nexport const definition = defineSection({ component: 'SectionCards', schema: [{ label: 'Content', fields: ${fields} }] })\n</script>\n\n<script setup lang="ts">\nconst props = defineProps(definitionToProps(definition))\n${setup}\n</script>\n\n<template>${template}</template>\n`
}

vueTester.run('dead-fallbacks', rule, {
  valid: [
    { filename, code: component(`const columns = computed(() => props.columns || '3')\nconst limit = computed(() => props.limit ?? 12)\nconst intro = computed(() => props.intro || t('cards.intro'))`) },
    { filename, code: component(`const columns = computed(() => props.columns ?? '2')\nconst gap = computed(() => props.gap ?? 's')`) },
    { filename, code: component(`const cta = computed(() => props.showCta !== false)\nconst shown = props.showCta ?? false`, `<h2>{{ heading ?? '' }}{{ heading ?? undefined }}</h2>`) },
    { filename, code: component(`const alignment = props.alignment ?? 'center-center'`) },
    { filename: runtime('app/components/Cards.vue'), code: `<script setup lang="ts">\nconst props = defineProps<{ columns?: string }>()\nconst columns = computed(() => props.columns ?? '3')\n</script>` },
    { filename: fixtureRuntime('app/sections/SectionCards.vue', 'components'), code: component(`const gap = props.gap ?? 's'`, '<div />', `import { sizeOptions as gapOptions } from '../shared-fields/sizes'`) },
  ],

  invalid: [
    { filename, code: component(`const columns = computed(() => props.columns ?? '3')`), errors: [{ messageId: 'picker', data: { type: 'select', fill: `'2'`, fallback: `'3'` } }] },
    { filename, code: component(`const gap = computed(() => props.gap ?? 'm')`), errors: [{ messageId: 'picker', data: { type: 'toggle_button', fill: `'s'`, fallback: `'m'` } }] },
    { filename, code: component(`const alignment = props.alignment ?? 'left'`), errors: [{ messageId: 'alignment', data: { fill: `'center-center'` } }] },
    { filename, code: component(`const cta = computed(() => props.showCta ?? true)`), errors: [{ messageId: 'checkbox' }] },
    { filename, code: component('', `<h2>{{ heading ?? t('cards.title') }}</h2>`), errors: [{ messageId: 'text', data: { type: 'text' } }] },
    { filename, code: component(`const intro = computed(() => props.intro ?? t('cards.intro'))`), errors: [{ messageId: 'text', data: { type: 'richtext' } }] },
    { filename, code: component('', `<Cards :columns="props.columns ?? '3'" />`), errors: [{ messageId: 'picker' }] },
    { filename: fixtureRuntime('app/sections/SectionCards.vue', 'components'), code: component(`const gap = props.gap ?? 'm'`, '<div />', `import { sizeOptions as gapOptions } from '../shared-fields/sizes'`), errors: [{ messageId: 'picker', data: { type: 'toggle_button', fill: `'s'`, fallback: `'m'` } }] },
  ],
})
