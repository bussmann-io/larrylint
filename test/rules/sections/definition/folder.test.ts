import rule from '../../../../src/rules/sections/definition/folder'
import { runtime, vueTester, withDefinition } from '../../../utils'

vueTester.run('definition-folder', rule, {
  valid: [
    { filename: runtime('app/sections/SectionHero.vue'), code: withDefinition(`defineSection({ component: 'SectionHero', schema: [] })`) },
    { filename: runtime('app/blocks/account/BlockProfile.vue'), code: withDefinition(`defineBlock({ component: 'BlockProfile', schema: [] })`) },
    { filename: runtime('app/overrides/SectionProductDetail.vue'), code: withDefinition(`defineSection({ component: 'SectionProductDetail', schema: [] })`) },
    { filename: runtime('app/components/Card.vue'), code: `<template><div /></template>` },
    { filename: runtime('app/section/SectionHeroSlider.vue'), code: withDefinition(`defineSection({ component: 'SectionHeroSlider', schema: [] })`) },
    { filename: runtime('app/block/BlockPlanCard.vue'), code: withDefinition(`defineBlock({ component: 'BlockPlanCard', schema: [] })`) },
  ],

  invalid: [
    {
      filename: runtime('app/components/Hero.vue'),
      code: withDefinition(`defineSection({ component: 'Hero', schema: [] })`),
      errors: [{ messageId: 'wrongFolder', data: { definer: 'defineSection', folder: 'sections' } }],
    },
    {
      filename: runtime('app/sections/SectionCard.vue'),
      code: withDefinition(`defineBlock({ component: 'SectionCard', schema: [] })`),
      errors: [{ messageId: 'notDefined' }, { messageId: 'wrongFolder' }],
    },
    {
      filename: runtime('app/blocks/CardImage.vue'),
      code: `<template><img /></template>`,
      errors: [{ messageId: 'notDefined', data: { folder: 'blocks', kind: 'block', definer: 'defineBlock' } }],
    },
  ],
})
