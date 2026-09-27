import rule from '../../../../src/rules/sections/definition/folder'
import { fixtureRuntime, runtime, vueTester, withDefinition } from '../../../utils'

vueTester.run('definition-folder', rule, {
  valid: [
    { filename: runtime('app/sections/SectionHero.vue'), code: withDefinition(`defineSection({ component: 'SectionHero', schema: [] })`) },
    { filename: runtime('app/blocks/account/BlockProfile.vue'), code: withDefinition(`defineBlock({ component: 'BlockProfile', schema: [] })`) },
    { filename: runtime('app/components/Card.vue'), code: `<template><div /></template>` },
    { filename: fixtureRuntime('app/section/hero/SectionHeroSlider.vue', 'registered'), code: withDefinition(`defineSection({ component: 'SectionHeroSlider', schema: [] })`) },
    { filename: fixtureRuntime('app/section/hero/BlockSlide.vue', 'registered'), code: withDefinition(`defineBlock({ component: 'BlockSlide', schema: [] })`) },
    { filename: fixtureRuntime('app/block/BlockPlanCard.vue', 'registered'), code: withDefinition(`defineBlock({ component: 'BlockPlanCard', schema: [] })`) },
    { filename: fixtureRuntime('app/section/hero/HeroSlide.vue', 'registered'), code: `<template><div /></template>` },
    { filename: fixtureRuntime('app/overrides/SectionProductDetail.vue', 'registered'), code: withDefinition(`defineSection({ component: 'SectionProductDetail', schema: [] })`) },
  ],

  invalid: [
    {
      filename: runtime('app/components/Hero.vue'),
      code: withDefinition(`defineSection({ component: 'Hero', schema: [] })`),
      errors: [{ messageId: 'wrongFolder', data: { definer: 'defineSection', folder: 'app/sections' } }],
    },
    {
      filename: runtime('app/sections/SectionCard.vue'),
      code: withDefinition(`defineBlock({ component: 'SectionCard', schema: [] })`),
      errors: [{ messageId: 'notDefined' }, { messageId: 'wrongFolder' }],
    },
    {
      filename: runtime('app/blocks/CardImage.vue'),
      code: `<template><img /></template>`,
      errors: [{ messageId: 'notDefined', data: { kind: 'block', definer: 'defineBlock' } }],
    },
    {
      filename: fixtureRuntime('app/components/Hero.vue', 'registered'),
      code: withDefinition(`defineSection({ component: 'Hero', schema: [] })`),
      errors: [{ messageId: 'wrongFolder', data: { definer: 'defineSection', folder: 'app/section' } }],
    },
    {
      filename: fixtureRuntime('app/blocks/BlockCard.vue', 'sections-only'),
      code: withDefinition(`defineBlock({ component: 'BlockCard', schema: [] })`),
      errors: [{ messageId: 'notRegistered', data: { kind: 'block' } }],
    },
  ],
})
