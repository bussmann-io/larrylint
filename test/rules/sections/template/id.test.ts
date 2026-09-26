import rule from '../../../../src/rules/sections/template/id'
import { runtime, vueTester } from '../../../utils'

const filename = runtime('app/sections/SectionHero.vue')
const script = `<script lang="ts">\nexport const definition = defineSection({ component: 'SectionHero', schema: [] })\n</script>\n`

vueTester.run('root-id', rule, {
  valid: [
    { filename, code: `${script}<template><section><h2 id="hero-heading">Hero</h2></section></template>` },
    { filename: runtime('app/components/Anchor.vue'), code: `<template><div id="anchor" /></template>` },
  ],

  invalid: [
    { filename, code: `${script}<template><section id="hero">Hero</section></template>`, errors: [{ messageId: 'rootId' }] },
    { filename, code: `${script}<template><section :id="anchor">Hero</section></template>`, errors: [{ messageId: 'rootId' }] },
  ],
})
