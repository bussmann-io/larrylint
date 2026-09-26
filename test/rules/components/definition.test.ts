import { definition } from '../../../src/rules/components/definition'
import { runtime, vueTester } from '../../utils'

function component(definition: string) {
  return `<script lang="ts">\nexport const definition = ${definition}\n</script>\n\n<template><div /></template>\n`
}

function section(fields: string) {
  return `<script lang="ts">
export const definition = defineSection({
  component: 'SectionHero',
  slots: [{ name: 'default' }],
  schema: [{ label: 'Content', fields: ${fields} }],
})
</script>
`
}

vueTester.run('definitions', definition, {
  valid: [
    { filename: runtime('app/sections/SectionHero.vue'), code: component(`defineSection({ component: 'SectionHero', schema: [] })`) },
    { filename: runtime('app/blocks/account/BlockProfile.vue'), code: component(`defineBlock({ component: 'BlockProfile', schema: [] })`) },
    { filename: runtime('app/overrides/SectionProductDetail.vue'), code: component(`defineSection({ component: 'SectionProductDetail', schema: [] })`) },
    { filename: runtime('app/components/Card.vue'), code: `<template><div /></template>` },
    { filename: runtime('app/sections/SectionHero.vue'), code: section(`[{ type: 'toggle_button', name: 'variant' }, { type: 'text', name: 'headingStyle' }]`) },
    { filename: runtime('app/sections/SectionHero.vue'), code: section(`[{ type: 'object', name: 'item', fields: [{ type: 'text', name: 'key' }] }]`) },
    { filename: runtime('app/sections/SectionHero.vue'), code: section(`[...sharedFields, buttonField({ name: 'style' })]`) },
  ],

  invalid: [
    {
      filename: runtime('app/sections/ContactFormSection.vue'),
      code: component(`defineSection({ component: 'ContactFormSection', schema: [] })`),
      errors: [{ messageId: 'prefix', data: { kind: 'section', prefix: 'Section', suggestion: 'SectionContactForm' } }],
    },
    {
      filename: runtime('app/blocks/BrunchCard.vue'),
      code: component(`defineBlock({ component: 'BrunchCard', schema: [] })`),
      errors: [{ messageId: 'prefix', data: { kind: 'block', prefix: 'Block', suggestion: 'BlockBrunchCard' } }],
    },
    {
      filename: runtime('app/sections/SectionHero.vue'),
      code: component(`defineSection({ component: 'SectionBanner', schema: [] })`),
      errors: [{ messageId: 'componentName', data: { actual: 'SectionBanner', expected: 'SectionHero' } }],
    },
    {
      filename: runtime('app/components/Hero.vue'),
      code: component(`defineSection({ component: 'Hero', schema: [] })`),
      errors: [{ messageId: 'wrongFolder', data: { definer: 'defineSection', folder: 'sections' } }],
    },
    {
      filename: runtime('app/sections/SectionCard.vue'),
      code: component(`defineBlock({ component: 'SectionCard', schema: [] })`),
      errors: [{ messageId: 'notDefined' }, { messageId: 'wrongFolder' }],
    },
    {
      filename: runtime('app/blocks/CardImage.vue'),
      code: `<template><img /></template>`,
      errors: [{ messageId: 'notDefined', data: { folder: 'blocks', kind: 'block', definer: 'defineBlock' } }],
    },
    {
      filename: runtime('app/sections/SectionHero.vue'),
      code: section(`[{ type: 'select', name: 'style' }, { type: 'text', name: 'key' }, { type: 'text', 'name': 'refFor' }]`),
      errors: [
        { messageId: 'forbiddenFieldName', data: { name: 'style' } },
        { messageId: 'forbiddenFieldName', data: { name: 'key' } },
        { messageId: 'forbiddenFieldName', data: { name: 'refFor' } },
      ],
    },
  ],
})
