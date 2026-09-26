import rule from '../../../../src/rules/sections/props/unused'
import { fixtureRuntime, runtime, vueTester } from '../../../utils'

const filename = runtime('app/sections/SectionHero.vue')

function component(fields: string, setup: string, template = '<div />') {
  return `<script lang="ts">\nexport const definition = defineSection({ component: 'SectionHero', schema: [{ label: 'Content', fields: ${fields} }] })\n</script>\n\n<script setup lang="ts">\n${setup}\n</script>\n\n<template>${template}</template>\n`
}

const fields = `[{ name: 'heading', type: 'text' }, { name: 'showCta', type: 'checkbox' }]`

vueTester.run('unused-fields', rule, {
  valid: [
    { filename, code: component(fields, `const props = defineProps(definitionToProps(definition))\nconst cta = computed(() => props.showCta)`, `<h2>{{ props.heading }}</h2>`) },
    { filename, code: component(fields, `defineProps(definitionToProps(definition))`, `<h2 v-if="showCta">{{ heading }}</h2>`) },
    { filename, code: component(fields, `const props = defineProps(definitionToProps(definition))\nconst { heading, showCta } = props`) },
    { filename, code: component(fields, `const props = defineProps(definitionToProps(definition))`, `<HeroBanner v-bind="props" />`) },
    { filename, code: component(fields, `const props = defineProps(definitionToProps(definition))\nconst state = useHero(props)`) },
    { filename, code: component(`[{ name: 'headingInfo', type: 'info' }, { name: 'products', type: 'query' }, { name: 'headingStyle', type: 'object', as: 'style', for: 'heading' }]`, `const props = defineProps(definitionToProps(definition))`) },
    { filename: fixtureRuntime('app/blocks/BlockTab.vue', 'components'), code: `<script lang="ts">\nexport const definition = defineBlock({ component: 'BlockTab', schema: [{ label: 'Content', fields: [{ name: 'slug', type: 'text' }, { name: 'tabLabel', type: 'text' }] }] })\n</script>\n\n<script setup lang="ts">\nconst props = defineProps(definitionToProps(definition))\n</script>\n\n<template><slot /></template>\n` },
  ],

  invalid: [
    {
      filename,
      code: component(fields, `const props = defineProps(definitionToProps(definition))`, `<h2>{{ props.heading }}</h2>`),
      errors: [{ messageId: 'unused', data: { name: 'showCta' } }],
    },
    {
      filename: fixtureRuntime('app/blocks/BlockCard.vue', 'components'),
      code: `<script lang="ts">\nexport const definition = defineBlock({ component: 'BlockCard', schema: [{ label: 'Content', fields: [{ name: 'slug', type: 'text' }, { name: 'badge', type: 'text' }] }] })\n</script>\n\n<script setup lang="ts">\nconst props = defineProps(definitionToProps(definition))\n</script>\n`,
      errors: [{ messageId: 'unused', data: { name: 'badge' } }],
    },
  ],
})
